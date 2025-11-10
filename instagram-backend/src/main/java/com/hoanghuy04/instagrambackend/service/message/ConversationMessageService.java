package com.hoanghuy04.instagrambackend.service.message;

import com.hoanghuy04.instagrambackend.dto.response.ConversationDTO;
import com.hoanghuy04.instagrambackend.dto.response.LastMessageDTO;
import com.hoanghuy04.instagrambackend.dto.response.MessageDTO;
import com.hoanghuy04.instagrambackend.dto.response.UserSummaryDTO;
import com.hoanghuy04.instagrambackend.dto.response.PageResponse;
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
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

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
    private final MessageRequestService messageRequestService;
    private final MessageRequestRepository messageRequestRepository;
    private final ConversationService conversationService;
    private final ConversationRepository conversationRepository;
    private final FollowRepository followRepository;
    private final UserRepository userRepository;
    private final WebSocketMessageService webSocketMessageService;
    
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
        
        // Auto-mark all unread messages as read when user sends a reply
        // Logic: When you reply to someone, it means you've read their messages
        autoMarkMessagesAsReadOnReply(conversationId, senderId);
        
        // Create message
        Message message = Message.builder()
            .conversation(conversation)
            .sender(sender)
            .receiver(null) // Deprecated field - will be populated for backward compatibility
            .content(content)
            .mediaUrl(mediaUrl)
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
                .build();
            
            message = messageRepository.save(message);
            
            // Create message request
            messageRequestService.createMessageRequest(senderId, receiverId, message);
            
            log.info("Message sent via request: {}", message.getId());
            return message;
        }
    }
    
    /**
     * Get messages in a conversation as DTOs (excluding deleted by user).
     *
     * @param conversationId the conversation ID
     * @param userId the user ID
     * @param pageable pagination information
     * @return PageResponse of MessageDTO
     */
    @Transactional(readOnly = true)
    public PageResponse<MessageDTO> getConversationMessagesAsDTO(String conversationId, String userId, Pageable pageable) {
        log.debug("Getting messages for conversation {} by user {}", conversationId, userId);
        
        // Verify user is participant
        if (!conversationService.isParticipant(conversationId, userId)) {
            throw new BadRequestException("You are not a participant in this conversation");
        }
        
        // Get messages directly
        List<Message> messages = messageRepository
            .findByConversationIdAndDeletedByNotContainingOrderByCreatedAtDesc(
                conversationId, 
                userId,
                pageable
            );
        
        // Convert to DTOs
        List<MessageDTO> messageDTOs = messages.stream()
            .map((Message message) -> convertToMessageDTO(message, userId))
            .collect(Collectors.toList());
        
        // Get total count
        List<Message> allMessages = messageRepository
            .findByConversationIdAndDeletedByNotContainingOrderByCreatedAtDesc(
                conversationId, 
                userId,
                Pageable.unpaged()
            );
        
        Page<MessageDTO> page = new org.springframework.data.domain.PageImpl<>(messageDTOs, pageable, allMessages.size());
        return PageResponse.of(page);
    }
    
    /**
     * Mark a message as read (unified intelligent method).
     * - Adds userId to readBy list
     * - Marks all messages in conversation as read (Instagram-style)
     * - Pushes WebSocket read receipt
     * 
     * Behavior:
     * - For conversation messages: marks all unread messages in the conversation as read
     * - For legacy messages: marks all messages between sender and receiver as read
     *
     * @param messageId the message ID
     * @param userId the user ID who reads the message
     */
    @Transactional
    public void markAsRead(String messageId, String userId) {
        log.info("Marking message {} as read by user {}", messageId, userId);
        
        Message message = getMessageById(messageId);
        
        // Add user to readBy list
        if (!message.getReadBy().contains(userId)) {
            message.getReadBy().add(userId);
            messageRepository.save(message);
        }
        
        // Mark ALL messages in conversation as read (Instagram behavior)
        if (message.getConversation() != null) {
            // Get all unread messages in this conversation
            Pageable unpaged = Pageable.unpaged();
            List<Message> unreadMessages = messageRepository
                .findByConversationIdAndDeletedByNotContainingOrderByCreatedAtDesc(
                    message.getConversation().getId(), 
                    userId,
                    unpaged
                );
            
            for (Message msg : unreadMessages) {
                if (!msg.getReadBy().contains(userId) && !msg.getSender().getId().equals(userId)) {
                    msg.getReadBy().add(userId);
                    messageRepository.save(msg);
                }
            }
        } else {
            // Legacy: mark all between sender and receiver
            User sender = message.getSender();
            User receiver = message.getReceiver();
            
            if (sender != null && receiver != null) {
                List<Message> unreadMessages = messageRepository
                    .findBySenderAndReceiverOrderByCreatedAtDesc(sender, receiver)
                    .stream()
                    .filter(msg -> msg.getReceiver() != null 
                        && msg.getReceiver().getId().equals(userId) 
                        && !msg.getReadBy().contains(userId))
                    .toList();
                
                for (Message msg : unreadMessages) {
                    msg.getReadBy().add(userId);
                    messageRepository.save(msg);
                }
            }
        }
        
        // Push WebSocket read receipt
        webSocketMessageService.pushReadReceipt(message, userId);
        
        log.info("Message marked as read successfully");
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
     * Auto-mark all unread messages as read when user sends a reply.
     * Logic: When you reply to someone, it means you've read their messages.
     * 
     * @param conversationId the conversation ID
     * @param userId the user ID who is sending the reply
     */
    private void autoMarkMessagesAsReadOnReply(String conversationId, String userId) {
        try {
            log.debug("Auto-marking messages as read for user {} in conversation {}", userId, conversationId);
            
            // Get all unread messages in this conversation that were NOT sent by this user
            Pageable unpaged = Pageable.unpaged();
            List<Message> unreadMessages = messageRepository
                .findByConversationIdAndDeletedByNotContainingOrderByCreatedAtDesc(
                    conversationId, 
                    userId,
                    unpaged
                );
            
            int markedCount = 0;
            for (Message msg : unreadMessages) {
            // Only mark messages sent by OTHER users
            if (!msg.getSender().getId().equals(userId) && !msg.getReadBy().contains(userId)) {
                msg.getReadBy().add(userId);
                messageRepository.save(msg);
                
                // Push read receipt via WebSocket for each message
                webSocketMessageService.pushReadReceipt(msg, userId);
                markedCount++;
            }
            }
            
            if (markedCount > 0) {
                log.info("Auto-marked {} messages as read for user {} when replying", markedCount, userId);
            }
        } catch (Exception e) {
            log.warn("Failed to auto-mark messages as read: {}", e.getMessage());
            // Don't fail the whole send operation if auto-mark fails
        }
    }
    
    /**
     * Convert User entity to UserSummaryDTO.
     *
     * @param user the User entity
     * @return UserSummaryDTO
     */
    public UserSummaryDTO convertToUserSummaryDTO(User user) {
        if (user == null) {
            return null;
        }
        return UserSummaryDTO.builder()
            .id(user.getId())
            .username(user.getUsername())
            .avatar(user.getProfile() != null && user.getProfile().getAvatar() != null
                ? user.getProfile().getAvatar()
                : null)
            .isVerified(user.isVerified())
            .build();
    }
    
    /**
     * Get user by ID.
     */
    //TODO: delete this method if there is a service implemented
    private User getUserById(String userId) {
        return userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
    }
    
    /**
     * Get message by ID.
     */
    //TODO: delete this method if there is a service implemented
    private Message getMessageById(String messageId) {
        return messageRepository.findById(messageId)
            .orElseThrow(() -> new ResourceNotFoundException("Message not found with id: " + messageId));
    }
    
    /**
     * Get all conversations for a user as DTOs with pagination.
     *
     * @param userId the user ID
     * @param pageable pagination information
     * @return PageResponse of ConversationDTO
     */
    @Transactional(readOnly = true)
    public PageResponse<ConversationDTO> getUserConversationsAsDTO(String userId, Pageable pageable) {
        log.debug("Getting conversations for user: {} with pagination", userId);
        
        List<Conversation> conversations = conversationService.getUserConversations(userId);
        
        // Convert to DTOs
        List<ConversationDTO> conversationDTOs = conversations.stream()
            .map(conv -> convertToConversationDTO(conv, userId))
            .collect(Collectors.toList());
        
        // Manual pagination
        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), conversationDTOs.size());
        List<ConversationDTO> paginatedConversations = start < conversationDTOs.size() 
            ? conversationDTOs.subList(start, end) 
            : new ArrayList<>();
        
        // Create Page object manually
        Page<ConversationDTO> page = new org.springframework.data.domain.PageImpl<>(
            paginatedConversations,
            pageable,
            conversationDTOs.size()
        );
        
        return PageResponse.of(page);
    }
    
    /**
     * Get conversation details as DTO.
     *
     * @param conversationId the conversation ID
     * @param userId the user ID (to verify access and calculate unread count)
     * @return ConversationDTO
     */
    @Transactional(readOnly = true)
    public ConversationDTO getConversationAsDTO(String conversationId, String userId) {
        log.debug("Getting conversation details: {} for user: {}", conversationId, userId);
        
        // Verify user is participant
        if (!conversationService.isParticipant(conversationId, userId)) {
            throw new BadRequestException("You are not a participant in this conversation");
        }
        
        Conversation conversation = conversationService.getConversationById(conversationId);
        return convertToConversationDTO(conversation, userId);
    }
    
    /**
     * Create a group conversation and return as DTO.
     *
     * @param creatorId the creator user ID
     * @param participantIds list of participant IDs
     * @param groupName the group name
     * @param avatar the group avatar URL
     * @return ConversationDTO
     */
    @Transactional
    public ConversationDTO createGroupAndConvertToDTO(
            String creatorId,
            List<String> participantIds,
            String groupName,
            String avatar) {
        Conversation conversation = conversationService.createGroupConversation(
            creatorId, participantIds, groupName, avatar
        );
        return convertToConversationDTO(conversation, creatorId);
    }
    
    /**
     * Update group info and return as DTO.
     *
     * @param conversationId the conversation ID
     * @param name the new group name
     * @param avatar the new avatar URL
     * @param userId the user ID (must be admin)
     * @return ConversationDTO
     */
    @Transactional
    public ConversationDTO updateGroupAndConvertToDTO(
            String conversationId,
            String name,
            String avatar,
            String userId) {
        Conversation conversation = conversationService.updateGroupInfo(conversationId, name, avatar);
        return convertToConversationDTO(conversation, userId);
    }
    
    /**
     * Convert Conversation entity to ConversationDTO.
     *
     * @param conversation the Conversation entity
     * @param currentUserId the current user ID (for unread count calculation)
     * @return ConversationDTO
     */
    public ConversationDTO convertToConversationDTO(Conversation conversation, String currentUserId) {
        // Get participants as UserSummaryDTO
        List<UserSummaryDTO> participants = conversation.getParticipants().stream()
            .map(userId -> {
                try {
                    User user = getUserById(userId);
                    return UserSummaryDTO.builder()
                        .id(user.getId())
                        .username(user.getUsername())
                        .avatar(user.getProfile() != null && user.getProfile().getAvatar() != null 
                            ? user.getProfile().getAvatar() 
                            : null)
                        .isVerified(user.isVerified())
                        .build();
                } catch (Exception e) {
                    log.warn("Failed to load user {}: {}", userId, e.getMessage());
                    return null;
                }
            })
            .filter(user -> user != null)
            .collect(Collectors.toList());
        
        // Convert last message
        LastMessageDTO lastMessageDTO = null;
        if (conversation.getLastMessage() != null) {
            try {
                User sender = getUserById(conversation.getLastMessage().getSenderId());
                lastMessageDTO = LastMessageDTO.builder()
                    .messageId(conversation.getLastMessage().getMessageId())
                    .content(conversation.getLastMessage().getContent())
                    .senderId(conversation.getLastMessage().getSenderId())
                    .senderUsername(sender.getUsername())
                    .timestamp(conversation.getLastMessage().getTimestamp())
                    .build();
            } catch (Exception e) {
                log.warn("Failed to load last message sender: {}", e.getMessage());
            }
        }
        
        return ConversationDTO.builder()
            .id(conversation.getId())
            .type(conversation.getType())
            .name(conversation.getName())
            .avatar(conversation.getAvatar())
            .participants(participants)
            .lastMessage(lastMessageDTO)
            .createdAt(conversation.getCreatedAt())
            .build();
    }
    
    /**
     * Convert Message entity to MessageDTO.
     *
     * @param message the Message entity
     * @param currentUserId the current user ID (to determine if message is deleted by user)
     * @return MessageDTO
     */
    public MessageDTO convertToMessageDTO(Message message, String currentUserId) {
        if (message == null) {
            return null;
        }
        
        // Get sender info
        UserSummaryDTO sender = null;
        if (message.getSender() != null) {
            try {
                User senderUser = message.getSender();
                sender = UserSummaryDTO.builder()
                    .id(senderUser.getId())
                    .username(senderUser.getUsername())
                    .avatar(senderUser.getProfile() != null && senderUser.getProfile().getAvatar() != null
                        ? senderUser.getProfile().getAvatar()
                        : null)
                    .isVerified(senderUser.isVerified())
                    .build();
            } catch (Exception e) {
                log.warn("Failed to load sender for message {}: {}", message.getId(), e.getMessage());
            }
        }
        
        // Get reply-to message if exists
        MessageDTO replyTo = null;
        if (message.getReplyToMessageId() != null) {
            try {
                Message replyToMessage = getMessageById(message.getReplyToMessageId());
                replyTo = MessageDTO.builder()
                    .id(replyToMessage.getId())
                    .sender(UserSummaryDTO.builder()
                        .id(replyToMessage.getSender().getId())
                        .username(replyToMessage.getSender().getUsername())
                        .build())
                    .content(replyToMessage.getContent())
                    .createdAt(replyToMessage.getCreatedAt())
                    .build();
            } catch (Exception e) {
                log.warn("Failed to load reply-to message {}: {}", message.getReplyToMessageId(), e.getMessage());
            }
        }
        
        return MessageDTO.builder()
            .id(message.getId())
            .conversationId(message.getConversation() != null ? message.getConversation().getId() : null)
            .sender(sender)
            .content(message.getContent())
            .mediaUrl(message.getMediaUrl())
            .readBy(new ArrayList<>(message.getReadBy()))
            .replyTo(replyTo)
            .createdAt(message.getCreatedAt())
            .isDeleted(message.getDeletedBy().contains(currentUserId))
            .build();
    }
}

