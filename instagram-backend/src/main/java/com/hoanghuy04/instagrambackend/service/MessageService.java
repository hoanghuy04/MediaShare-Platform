package com.hoanghuy04.instagrambackend.service;

import com.hoanghuy04.instagrambackend.dto.request.SendMessageRequest;
import com.hoanghuy04.instagrambackend.dto.response.Conversation;
import com.hoanghuy04.instagrambackend.dto.response.MessageResponse;
import com.hoanghuy04.instagrambackend.dto.response.PageResponse;
import com.hoanghuy04.instagrambackend.dto.websocket.ChatMessage;
import com.hoanghuy04.instagrambackend.entity.Message;
import com.hoanghuy04.instagrambackend.entity.User;
import com.hoanghuy04.instagrambackend.exception.ResourceNotFoundException;
import com.hoanghuy04.instagrambackend.repository.MessageRepository;
import com.hoanghuy04.instagrambackend.service.message.ConversationMessageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Service class for message operations.
 * Handles direct messaging between users.
 * Integrated with WebSocket for real-time messaging.
 * 
 * @author Instagram Backend Team
 * @version 1.0.0
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MessageService {
    
    private final MessageRepository messageRepository;
    private final UserService userService;
    private final SimpMessagingTemplate messagingTemplate;
    private final ConversationMessageService conversationMessageService;
    
    /**
     * Send a message to a user.
     * Also pushes the message via WebSocket for real-time delivery.
     *
     * @param request the message send request
     * @param senderId the sender user ID
     * @return MessageResponse
     */
    @Transactional
    public MessageResponse sendMessage(SendMessageRequest request, String senderId) {
        log.info("Sending message from user {} to user: {}", senderId, request.getReceiverId());
        
        try {
            // NEW: Use ConversationMessageService for proper conversation handling
            Message message = conversationMessageService.sendMessage(
                senderId, 
                request.getReceiverId(), 
                request.getContent(), 
                request.getMediaUrl()
            );
            
            // Push message via WebSocket for real-time delivery
            pushMessageViaWebSocket(message);
            
            return convertToMessageResponse(message);
            
        } catch (Exception e) {
            log.warn("Failed to send message via conversation service: {}. Falling back to old method.", e.getMessage());
            
            // FALLBACK: Old method if conversation service fails
            return sendMessageOldMethod(request, senderId);
        }
    }
    
    /**
     * Fallback method using old direct messaging approach.
     */
    private MessageResponse sendMessageOldMethod(SendMessageRequest request, String senderId) {
        User sender = userService.getUserEntityById(senderId);
        User receiver = userService.getUserEntityById(request.getReceiverId());
        
        Message message = Message.builder()
                .sender(sender)
                .receiver(receiver)
                .content(request.getContent())
                .mediaUrl(request.getMediaUrl())
                .isRead(false)
                .build();
        
        message = messageRepository.save(message);
        
        // Update last interaction time for both users
        updateLastInteractionTime(senderId, request.getReceiverId());
        updateLastInteractionTime(request.getReceiverId(), senderId);
        
        log.info("Message sent successfully (old method): {}", message.getId());
        
        // Push message via WebSocket for real-time delivery
        pushMessageViaWebSocket(message);
        
        return convertToMessageResponse(message);
    }
    
    /**
     * Push message via WebSocket to receiver.
     */
    private void pushMessageViaWebSocket(Message message) {
        try {
            User sender = message.getSender();
            User receiver = message.getReceiver();
            
            ChatMessage chatMessage = ChatMessage.builder()
                    .id(message.getId())
                    .type(ChatMessage.MessageType.CHAT)
                    .senderId(sender.getId())
                    .senderUsername(sender.getUsername())
                    .senderProfileImage(sender.getProfile() != null ? sender.getProfile().getAvatar() : null)
                    .receiverId(receiver != null ? receiver.getId() : null)
                    .content(message.getContent())
                    .mediaUrl(message.getMediaUrl())
                    .timestamp(message.getCreatedAt())
                    .status(ChatMessage.MessageStatus.SENT)
                    .build();
            
            // Send to receiver if exists
            if (receiver != null) {
                messagingTemplate.convertAndSendToUser(
                        receiver.getId(),
                        "/queue/messages",
                        chatMessage
                );
                log.debug("Message pushed via WebSocket to user: {}", receiver.getId());
            }
        } catch (Exception e) {
            log.warn("Failed to push message via WebSocket: {}", e.getMessage());
            // Don't fail the whole operation if WebSocket push fails
        }
    }
    
    /**
     * Get conversation between two users.
     *
     * @param userId the current user ID
     * @param otherUserId the other user ID
     * @param pageable pagination information
     * @return PageResponse of MessageResponse
     */
    @Transactional(readOnly = true)
    public PageResponse<MessageResponse> getConversation(String userId, String otherUserId, Pageable pageable) {
        log.debug("Getting conversation between user {} and user: {}", userId, otherUserId);
        
        Page<MessageResponse> page = messageRepository.findConversationByIds(userId, otherUserId, pageable)
                .map(this::convertToMessageResponse);
        
        return PageResponse.of(page);
    }
    
    /**
     * Get all conversations for a user.
     *
     * @param userId the user ID
     * @param pageable pagination information
     * @return PageResponse of Conversation
     */
    @Transactional(readOnly = true)
    public PageResponse<Conversation> getConversations(String userId, Pageable pageable) {
        log.debug("Getting all conversations for user: {}", userId);
        
        User user = userService.getUserEntityById(userId);
        
        // Get all messages sent or received by the user
        List<Message> sentMessages = messageRepository.findBySender(user, Pageable.unpaged()).getContent();
        List<Message> receivedMessages = messageRepository.findByReceiver(user, Pageable.unpaged()).getContent();
        
        // Group by conversation partner
        Map<String, Message> conversationMap = new HashMap<>();
        
        for (Message msg : sentMessages) {
            String partnerId = msg.getReceiver().getId();
            if (!conversationMap.containsKey(partnerId) || 
                msg.getCreatedAt().isAfter(conversationMap.get(partnerId).getCreatedAt())) {
                conversationMap.put(partnerId, msg);
            }
        }
        
        for (Message msg : receivedMessages) {
            String partnerId = msg.getSender().getId();
            if (!conversationMap.containsKey(partnerId) || 
                msg.getCreatedAt().isAfter(conversationMap.get(partnerId).getCreatedAt())) {
                conversationMap.put(partnerId, msg);
            }
        }
        
        // Convert to Conversation objects
        List<Conversation> conversations = new ArrayList<>();
        for (Map.Entry<String, Message> entry : conversationMap.entrySet()) {
            String partnerId = entry.getKey();
            Message lastMessage = entry.getValue();
            User otherUser = lastMessage.getSender().getId().equals(userId) 
                    ? lastMessage.getReceiver() 
                    : lastMessage.getSender();
            
            // Count unread messages for this specific conversation
            long unreadCount = messageRepository.countByReceiverAndSenderAndIsReadFalse(user, otherUser);
            
            Conversation conversation = Conversation.builder()
                    .conversationId(partnerId)
                    .otherUser(userService.convertToUserResponse(otherUser))
                    .lastMessage(convertToMessageResponse(lastMessage))
                    .unreadCount((int) unreadCount)
                    .lastMessageTime(lastMessage.getCreatedAt())
                    .build();
            
            conversations.add(conversation);
        }
        
        // Sort conversations by last message time DESC
        conversations.sort((c1, c2) -> 
            c2.getLastMessageTime().compareTo(c1.getLastMessageTime())
        );
        
        // Manual pagination
        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), conversations.size());
        
        List<Conversation> paginatedConversations = conversations.subList(start, end);
        
        // Create Page object manually
        Page<Conversation> page = new org.springframework.data.domain.PageImpl<>(
            paginatedConversations,
            pageable,
            conversations.size()
        );
        
        return PageResponse.of(page);
    }
    
    /**
     * Mark a message as read.
     * Also marks all messages in the same conversation as read (Instagram-style behavior).
     * Also pushes read receipt via WebSocket.
     *
     * @param messageId the message ID
     */
    @Transactional
    public void markAsRead(String messageId) {
        log.info("Marking message as read: {}", messageId);
        
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found with id: " + messageId));
        
        // Mark this message as read
        message.setRead(true);
        messageRepository.save(message);
        
        // NEW: If message has conversation, mark all messages in conversation as read
        if (message.getConversation() != null && message.getReceiver() != null) {
            try {
                // Get the current user (receiver of this message)
                String currentUserId = message.getReceiver().getId();
                conversationMessageService.markConversationAsRead(
                    message.getConversation().getId(), 
                    currentUserId
                );
                log.info("All messages in conversation marked as read");
            } catch (Exception e) {
                log.warn("Failed to mark all conversation messages as read: {}", e.getMessage());
            }
        } else {
            // OLD METHOD: For messages without conversation, mark all between these two users as read
            try {
                User sender = message.getSender();
                User receiver = message.getReceiver();
                
                if (sender != null && receiver != null) {
                    // Get all unread messages between these two users
                    List<Message> unreadMessages = messageRepository.findBySenderAndReceiverOrderByCreatedAtDesc(sender, receiver)
                        .stream()
                        .filter(msg -> msg.getReceiver().getId().equals(receiver.getId()) && !msg.isRead())
                        .toList();
                    
                    // Mark them all as read
                    for (Message msg : unreadMessages) {
                        msg.setRead(true);
                        messageRepository.save(msg);
                    }
                    
                    log.info("Marked {} messages as read between users", unreadMessages.size());
                }
            } catch (Exception e) {
                log.warn("Failed to mark all messages as read: {}", e.getMessage());
            }
        }
        
        log.info("Message marked as read successfully");
        
        // Push read receipt via WebSocket
        try {
            if (message.getReceiver() != null && message.getSender() != null) {
                ChatMessage readReceipt = ChatMessage.builder()
                        .id(message.getId())
                        .type(ChatMessage.MessageType.READ)
                        .senderId(message.getReceiver().getId())
                        .receiverId(message.getSender().getId())
                        .status(ChatMessage.MessageStatus.READ)
                        .timestamp(message.getCreatedAt())
                        .build();
                
                // Notify sender that message was read
                messagingTemplate.convertAndSendToUser(
                        message.getSender().getId(),
                        "/queue/read-receipts",
                        readReceipt
                );
                
                log.debug("Read receipt pushed via WebSocket to user: {}", message.getSender().getId());
            }
        } catch (Exception e) {
            log.warn("Failed to push read receipt via WebSocket: {}", e.getMessage());
        }
    }
    
    /**
     * Delete a message.
     *
     * @param messageId the message ID
     */
    @Transactional
    public void deleteMessage(String messageId) {
        log.info("Deleting message: {}", messageId);
        
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found with id: " + messageId));
        
        messageRepository.delete(message);
        log.info("Message deleted successfully");
    }
    
    
    /**
     * Update last interaction time for a conversation.
     * This method is now simplified and doesn't use ConversationMetadata.
     *
     * @param userId the user ID
     * @param partnerId the partner ID
     */
    @Transactional
    public void updateLastInteractionTime(String userId, String partnerId) {
        // Since we removed ConversationMetadata, this method is now a no-op
        // Conversations will be sorted by the latest message timestamp
        log.info("Last interaction time update for user {} with partner: {} - no longer tracked", userId, partnerId);
    }
    
    
    /**
     * Convert Message entity to MessageResponse DTO.
     *
     * @param message the Message entity
     * @return MessageResponse DTO
     */
    private MessageResponse convertToMessageResponse(Message message) {
        return MessageResponse.builder()
                .id(message.getId())
                .sender(userService.convertToUserResponse(message.getSender()))
                .receiver(userService.convertToUserResponse(message.getReceiver()))
                .content(message.getContent())
                .mediaUrl(message.getMediaUrl())
                .isRead(message.isRead())
                .createdAt(message.getCreatedAt())
                .build();
    }
}

