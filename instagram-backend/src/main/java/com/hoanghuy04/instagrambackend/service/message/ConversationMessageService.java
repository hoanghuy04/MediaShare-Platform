package com.hoanghuy04.instagrambackend.service.message;

import com.hoanghuy04.instagrambackend.entity.Message;
import com.hoanghuy04.instagrambackend.entity.User;
import com.hoanghuy04.instagrambackend.entity.message.Conversation;
import com.hoanghuy04.instagrambackend.entity.message.MessageRequest;
import com.hoanghuy04.instagrambackend.enums.ConversationType;
import com.hoanghuy04.instagrambackend.enums.RequestStatus;
import com.hoanghuy04.instagrambackend.exception.BadRequestException;
import com.hoanghuy04.instagrambackend.exception.ResourceNotFoundException;
import com.hoanghuy04.instagrambackend.repository.FollowRepository;
import com.hoanghuy04.instagrambackend.repository.MessageRepository;
import com.hoanghuy04.instagrambackend.repository.UserRepository;
import com.hoanghuy04.instagrambackend.repository.message.ConversationRepository;
import com.hoanghuy04.instagrambackend.repository.message.MessageRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

/**
 * Service class for conversation-based message operations.
 * Handles sending, reading, and managing messages within conversations.
 * 
 * @author Instagram Backend Team
 * @version 2.0.0
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ConversationMessageService {
    
    private final MessageRepository messageRepository;
    private final ConversationService conversationService;
    private final MessageRequestService messageRequestService;
    private final ConversationRepository conversationRepository;
    private final MessageRequestRepository messageRequestRepository;
    private final UserRepository userRepository;
    private final FollowRepository followRepository;
    
    /**
     * Send a message to a conversation.
     * Also checks for message requests if users are not connected.
     *
     * @param conversationId the conversation ID
     * @param senderId the sender user ID
     * @param content the message content
     * @param mediaUrl the media URL (optional)
     * @return Message entity
     */
    @Transactional
    public Message sendMessageToConversation(String conversationId, String senderId, String content, String mediaUrl) {
        log.info("Sending message to conversation {} by user {}", conversationId, senderId);
        
        // Verify user is participant
        if (!conversationService.isParticipant(conversationId, senderId)) {
            throw new BadRequestException("You are not a participant in this conversation");
        }
        
        // Get conversation
        Conversation conversation = conversationService.getConversationById(conversationId);
        
        // Get sender
        User sender = getUserById(senderId);
        
        // Create message
        Message message = Message.builder()
            .conversation(conversation)
            .sender(sender)
            .receiver(null) // Deprecated field - will be populated for backward compatibility
            .content(content)
            .mediaUrl(mediaUrl)
            .isRead(false)
            .build();
        
        // Set receiver for backward compatibility (for WebSocket and old queries)
        // Only set receiver if it's a direct conversation
        if (conversation.getType() == com.hoanghuy04.instagrambackend.enums.ConversationType.DIRECT) {
            // Get the other participant
            String otherParticipantId = conversation.getParticipants().stream()
                .filter(id -> !id.equals(senderId))
                .findFirst()
                .orElse(null);
            
            if (otherParticipantId != null) {
                User receiver = getUserById(otherParticipantId);
                message.setReceiver(receiver);
            }
        }
        
        message = messageRepository.save(message);
        
        // Update last message in conversation
        conversationService.updateLastMessage(conversationId, message);
        
        log.info("Message sent successfully: {}", message.getId());
        return message;
    }
    
    /**
     * Send a message to a user (backward compatibility).
     * Checks for connection and creates message request if needed.
     *
     * @param senderId the sender ID
     * @param receiverId the receiver ID
     * @param content the message content
     * @param mediaUrl the media URL (optional)
     * @return Message entity
     */
    @Transactional
    public Message sendMessage(String senderId, String receiverId, String content, String mediaUrl) {
        log.info("Sending message from {} to {}", senderId, receiverId);
        
        // Get sender and receiver
        User sender = getUserById(senderId);
        User receiver = getUserById(receiverId);
        
        // Check if users are connected
        boolean areConnected = areUsersConnected(senderId, receiverId);
        
        if (areConnected) {
            // Users are connected, send message directly
            Conversation conversation = conversationService.getOrCreateDirectConversation(senderId, receiverId);
            return sendMessageToConversation(conversation.getId(), senderId, content, mediaUrl);
        } else {
            // Check if receiver has a pending request from sender (reciprocal request)
            Optional<MessageRequest> incomingRequest = messageRequestRepository.findBySenderIdAndReceiverIdAndStatus(
                receiverId, senderId, RequestStatus.PENDING
            );
            
            if (incomingRequest.isPresent()) {
                // Receiver has sent a request to sender - auto-accept it!
                log.info("Auto-accepting message request from {} to {}", receiverId, senderId);
                
                MessageRequest request = incomingRequest.get();
                
                // Accept the request (creates conversation and updates status)
                messageRequestService.acceptRequest(request.getId(), senderId);
                
                // Now send message normally in the created conversation
                Conversation conversation = conversationService.getOrCreateDirectConversation(senderId, receiverId);
                return sendMessageToConversation(conversation.getId(), senderId, content, mediaUrl);
            }
            
            // No incoming request - create new message request
            // Create message first
            Message message = Message.builder()
                .conversation(null) // No conversation yet
                .sender(sender)
                .receiver(receiver)
                .content(content)
                .mediaUrl(mediaUrl)
                .isRead(false)
                .build();
            
            message = messageRepository.save(message);
            
            // Create message request
            messageRequestService.createMessageRequest(senderId, receiverId, message);
            
            log.info("Message sent via request: {}", message.getId());
            return message;
        }
    }
    
    /**
     * Get messages in a conversation (excluding deleted by user).
     *
     * @param conversationId the conversation ID
     * @param userId the user ID
     * @param pageable pagination information
     * @return Page of messages
     */
    @Transactional(readOnly = true)
    public Page<Message> getConversationMessages(String conversationId, String userId, Pageable pageable) {
        log.debug("Getting messages for conversation {} by user {}", conversationId, userId);
        
        // Verify user is participant
        if (!conversationService.isParticipant(conversationId, userId)) {
            throw new BadRequestException("You are not a participant in this conversation");
        }
        
        List<Message> messages = messageRepository.findByConversationIdAndDeletedByNotContainingOrderByCreatedAtDesc(
            conversationId, 
            userId,
            pageable
        );
        
        // Convert to Page
        Pageable unpagedPageable = PageRequest.of(0, Integer.MAX_VALUE);
        List<Message> allMessages = messageRepository.findByConversationIdAndDeletedByNotContainingOrderByCreatedAtDesc(
            conversationId, 
            userId,
            unpagedPageable
        );
        
        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), messages.size());
        List<Message> paginatedMessages = messages.subList(start, end);
        
        return new org.springframework.data.domain.PageImpl<>(
            paginatedMessages,
            pageable,
            allMessages.size()
        );
    }
    
    /**
     * Mark a message as read.
     *
     * @param messageId the message ID
     * @param userId the user ID who reads the message
     */
    @Transactional
    public void markAsRead(String messageId, String userId) {
        log.info("Marking message {} as read by user {}", messageId, userId);
        
        Message message = getMessageById(messageId);
        
        // Add user to readBy list if not already there
        if (!message.getReadBy().contains(userId)) {
            message.getReadBy().add(userId);
            
            // Also update deprecated isRead field for backward compatibility
            if (message.getConversation() != null) {
                // For conversation messages, mark as read for backward compatibility
                message.setRead(true);
            }
            
            messageRepository.save(message);
            log.info("Message marked as read successfully");
        }
    }
    
    /**
     * Mark all messages in a conversation as read.
     *
     * @param conversationId the conversation ID
     * @param userId the user ID
     */
    @Transactional
    public void markConversationAsRead(String conversationId, String userId) {
        log.info("Marking all messages in conversation {} as read by user {}", conversationId, userId);
        
        // Verify user is participant
        if (!conversationService.isParticipant(conversationId, userId)) {
            throw new BadRequestException("You are not a participant in this conversation");
        }
        
        // Get all unread messages
        Pageable pageable = PageRequest.of(0, Integer.MAX_VALUE);
        List<Message> messages = messageRepository.findByConversationIdAndDeletedByNotContainingOrderByCreatedAtDesc(
            conversationId, 
            userId,
            pageable
        );
        
        // Mark each as read
        for (Message message : messages) {
            if (!message.getReadBy().contains(userId) && !message.getSender().getId().equals(userId)) {
                markAsRead(message.getId(), userId);
            }
        }
        
        log.info("All messages marked as read successfully");
    }
    
    /**
     * Delete a message for a user (soft delete).
     *
     * @param messageId the message ID
     * @param userId the user ID
     */
    @Transactional
    public void deleteMessageForUser(String messageId, String userId) {
        log.info("Deleting message {} for user {}", messageId, userId);
        
        Message message = getMessageById(messageId);
        
        // Add user to deletedBy list
        if (!message.getDeletedBy().contains(userId)) {
            message.getDeletedBy().add(userId);
            message.setDeletedAt(LocalDateTime.now());
            messageRepository.save(message);
            log.info("Message deleted for user successfully");
        }
    }
    
    /**
     * Delete a conversation for a user (soft delete).
     * Hides the conversation from user's list but keeps it visible to others.
     *
     * @param conversationId the conversation ID
     * @param userId the user ID
     */
    @Transactional
    public void deleteConversationForUser(String conversationId, String userId) {
        log.info("Deleting conversation {} for user {}", conversationId, userId);
        
        // Get conversation
        Conversation conversation = conversationService.getConversationById(conversationId);
        
        // Verify user is participant
        if (!conversation.getParticipants().contains(userId)) {
            throw new BadRequestException("You are not a participant in this conversation");
        }
        
        // Add user to deletedBy list if not already there
        if (!conversation.getDeletedBy().contains(userId)) {
            conversation.getDeletedBy().add(userId);
            conversationRepository.save(conversation);
            log.info("Conversation deleted for user successfully");
        } else {
            log.debug("Conversation already deleted for user");
        }
    }
    
    /**
     * Reply to a message (threading support).
     *
     * @param conversationId the conversation ID
     * @param senderId the sender ID
     * @param replyToMessageId the message ID to reply to
     * @param content the reply content
     * @return Message entity
     */
    @Transactional
    public Message replyToMessage(String conversationId, String senderId, String replyToMessageId, String content) {
        log.info("Replying to message {} in conversation {} by user {}", replyToMessageId, conversationId, senderId);
        
        // Verify user is participant
        if (!conversationService.isParticipant(conversationId, senderId)) {
            throw new BadRequestException("You are not a participant in this conversation");
        }
        
        // Verify reply-to message exists
        Message replyToMessage = getMessageById(replyToMessageId);
        
        if (!replyToMessage.getConversation().getId().equals(conversationId)) {
            throw new BadRequestException("Reply-to message is not in this conversation");
        }
        
        // Create reply message
        User sender = getUserById(senderId);
        Conversation conversation = conversationService.getConversationById(conversationId);
        
        Message message = Message.builder()
            .conversation(conversation)
            .sender(sender)
            .content(content)
            .replyToMessageId(replyToMessageId)
            .build();
        
        message = messageRepository.save(message);
        
        // Update last message
        conversationService.updateLastMessage(conversationId, message);
        
        log.info("Reply sent successfully: {}", message.getId());
        return message;
    }
    
    /**
     * Check if two users are connected.
     * Users are considered connected if:
     * 1. They follow each other, OR
     * 2. They have an existing conversation (already chatting before)
     *
     * @param userId1 first user ID
     * @param userId2 second user ID
     * @return true if users are connected
     */
    @Transactional(readOnly = true)
    protected boolean areUsersConnected(String userId1, String userId2) {
        // Check if both users follow each other
        boolean user1FollowsUser2 = followRepository.existsByFollowerIdAndFollowingId(userId1, userId2);
        boolean user2FollowsUser1 = followRepository.existsByFollowerIdAndFollowingId(userId2, userId1);
        boolean followingEachOther = user1FollowsUser2 && user2FollowsUser1;
        
        if (followingEachOther) {
            return true;
        }
        
        // Check if they have an existing conversation
        List<String> participants = new ArrayList<>();
        participants.add(userId1);
        participants.add(userId2);
        Collections.sort(participants);
        
        Optional<Conversation> existingConversation = conversationRepository.findByTypeAndParticipants(
            ConversationType.DIRECT, participants, 2
        );
        
        boolean hasConversation = existingConversation.isPresent();
        
        if (hasConversation) {
            log.debug("Users {} and {} have existing conversation - considered connected", userId1, userId2);
        }
        
        return followingEachOther || hasConversation;
    }
    
    /**
     * Get user by ID.
     */
    private User getUserById(String userId) {
        return userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
    }
    
    /**
     * Get message by ID.
     */
    private Message getMessageById(String messageId) {
        return messageRepository.findById(messageId)
            .orElseThrow(() -> new ResourceNotFoundException("Message not found with id: " + messageId));
    }
}

