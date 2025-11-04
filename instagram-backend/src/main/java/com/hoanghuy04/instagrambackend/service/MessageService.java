package com.hoanghuy04.instagrambackend.service;

import com.hoanghuy04.instagrambackend.dto.message.request.SendMessageRequest;
import com.hoanghuy04.instagrambackend.exception.BadRequestException;
import com.hoanghuy04.instagrambackend.dto.response.Conversation;
import com.hoanghuy04.instagrambackend.dto.response.MessageResponse;
import com.hoanghuy04.instagrambackend.dto.response.PageResponse;
import com.hoanghuy04.instagrambackend.entity.Message;
import com.hoanghuy04.instagrambackend.entity.User;
import com.hoanghuy04.instagrambackend.exception.ResourceNotFoundException;
import com.hoanghuy04.instagrambackend.repository.MessageRepository;
import com.hoanghuy04.instagrambackend.service.message.ConversationMessageService;
import com.hoanghuy04.instagrambackend.service.message.WebSocketMessageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Service class for message operations (Legacy/Adapter).
 * This service acts as an adapter layer for backward compatibility.
 * Most new functionality should use ConversationMessageService directly.
 * 
 * @author Instagram Backend Team
 * @version 2.0.0
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MessageService {
    
    private final MessageRepository messageRepository;
    private final UserService userService;
    private final ConversationMessageService conversationMessageService;
    private final WebSocketMessageService webSocketMessageService;
    
    /**
     * Send a message to a user or conversation.
     * Also pushes the message via WebSocket for real-time delivery.
     * 
     * Priority:
     * 1. If conversationId is provided → send to conversation (direct or group)
     * 2. If receiverId is provided → send direct message (creates conversation if needed)
     *
     * @param request the message send request
     * @param senderId the sender user ID
     * @return MessageResponse
     */
    @Transactional
    public MessageResponse sendMessage(SendMessageRequest request, String senderId) {
        log.info("Sending message from user {}", senderId);
        
        if (request.getConversationId() == null && request.getReceiverId() == null) {
            throw new BadRequestException("Either conversationId or receiverId must be provided");
        }
        
        Message message;
        
        // Priority 1: Send to conversation if conversationId is provided
        if (request.getConversationId() != null && !request.getConversationId().isBlank()) {
            log.info("Sending message to conversation: {}", request.getConversationId());
            
            if (request.getReplyToMessageId() != null && !request.getReplyToMessageId().isBlank()) {
                // Send as reply
                message = conversationMessageService.replyToMessage(
                    request.getConversationId(),
                    senderId,
                    request.getReplyToMessageId(),
                    request.getContent()
                );
            } else {
                // Send normal message to conversation
                message = conversationMessageService.sendMessageToConversation(
                    request.getConversationId(),
                    senderId,
                    request.getContent(),
                    request.getMediaUrl()
                );
            }
        } else {
            // Priority 2: Send direct message if receiverId is provided
            log.info("Sending direct message to user: {}", request.getReceiverId());
            message = conversationMessageService.sendMessage(
                senderId,
                request.getReceiverId(),
                request.getContent(),
                request.getMediaUrl()
            );
        }
        
        // Push message via WebSocket for real-time delivery
        webSocketMessageService.pushMessage(message);
        
        return convertToMessageResponse(message);
    }
    
    /**
     * Get conversation between two users (Legacy endpoint).
     * Uses old-style query based on sender/receiver.
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
     * Get all conversations for a user (Legacy endpoint).
     * Uses old-style query based on sent/received messages.
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
            if (msg.getReceiver() != null) {
                String partnerId = msg.getReceiver().getId();
                if (!conversationMap.containsKey(partnerId) || 
                    msg.getCreatedAt().isAfter(conversationMap.get(partnerId).getCreatedAt())) {
                    conversationMap.put(partnerId, msg);
                }
            }
        }
        
        for (Message msg : receivedMessages) {
            if (msg.getSender() != null) {
                String partnerId = msg.getSender().getId();
                if (!conversationMap.containsKey(partnerId) || 
                    msg.getCreatedAt().isAfter(conversationMap.get(partnerId).getCreatedAt())) {
                    conversationMap.put(partnerId, msg);
                }
            }
        }
        
        // Convert to Conversation objects
        List<Conversation> conversations = new ArrayList<>();
        for (Map.Entry<String, Message> entry : conversationMap.entrySet()) {
            String partnerId = entry.getKey();
            Message lastMessage = entry.getValue();
            
            if (lastMessage.getSender() == null || lastMessage.getReceiver() == null) {
                continue;
            }
            
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
        
        // If message belongs to a conversation, use ConversationMessageService
        if (message.getConversation() != null) {
            // Get the current user (receiver of this message)
            String currentUserId = message.getReceiver() != null 
                ? message.getReceiver().getId() 
                : null;
            
            if (currentUserId != null) {
                // Mark all messages in conversation as read
                conversationMessageService.markConversationAsRead(
                    message.getConversation().getId(), 
                    currentUserId
                );
                
                // Push read receipt via WebSocket
                webSocketMessageService.pushReadReceipt(message, currentUserId);
                
                log.info("All messages in conversation marked as read");
            } else {
                // Fallback: just mark this message as read
                markMessageAsReadLegacy(message);
            }
        } else {
            // Legacy message: mark all between these two users as read
            markMessageAsReadLegacy(message);
        }
        
        log.info("Message marked as read successfully");
    }
    
    /**
     * Legacy method to mark messages as read (for messages without conversation).
     */
    private void markMessageAsReadLegacy(Message message) {
        try {
            User sender = message.getSender();
            User receiver = message.getReceiver();
            
            if (sender != null && receiver != null) {
                // Get all unread messages between these two users
                List<Message> unreadMessages = messageRepository.findBySenderAndReceiverOrderByCreatedAtDesc(sender, receiver)
                    .stream()
                    .filter(msg -> msg.getReceiver() != null 
                        && msg.getReceiver().getId().equals(receiver.getId()) 
                        && !msg.isRead())
                    .toList();
                
                // Mark them all as read
                for (Message msg : unreadMessages) {
                    msg.setRead(true);
                    messageRepository.save(msg);
                }
                
                // Push read receipt via WebSocket
                webSocketMessageService.pushReadReceipt(message, receiver.getId());
                
                log.info("Marked {} messages as read between users", unreadMessages.size());
            }
        } catch (Exception e) {
            log.warn("Failed to mark all messages as read: {}", e.getMessage());
        }
    }
    
    /**
     * Delete a message.
     * Uses soft delete from ConversationMessageService if message has conversation,
     * otherwise uses hard delete (backward compatibility).
     *
     * @param messageId the message ID
     */
    @Transactional
    public void deleteMessage(String messageId) {
        log.info("Deleting message: {}", messageId);
        
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found with id: " + messageId));
        
        // If message belongs to a conversation, use soft delete
        if (message.getConversation() != null) {
            // Get current user from receiver (if available)
            if (message.getReceiver() != null) {
                String userId = message.getReceiver().getId();
                conversationMessageService.deleteMessageForUser(messageId, userId);
                log.info("Message soft deleted for user: {}", userId);
            } else {
                // Fallback to hard delete if no receiver
                messageRepository.delete(message);
                log.info("Message hard deleted");
            }
        } else {
            // Legacy message without conversation - hard delete
            messageRepository.delete(message);
            log.info("Message hard deleted (legacy)");
        }
    }
    
    /**
     * Convert Message entity to MessageResponse DTO.
     * Handles both direct messages (with receiver) and group messages (receiver = null).
     *
     * @param message the Message entity
     * @return MessageResponse DTO
     */
    private MessageResponse convertToMessageResponse(Message message) {
        if (message == null) {
            return null;
        }
        
        if (message.getSender() == null) {
            log.warn("Message {} has null sender, cannot convert to response", message.getId());
            throw new IllegalStateException("Message sender cannot be null");
        }
        
        return MessageResponse.builder()
                .id(message.getId())
                .sender(userService.convertToUserResponse(message.getSender()))
                .receiver(message.getReceiver() != null 
                        ? userService.convertToUserResponse(message.getReceiver()) 
                        : null)
                .content(message.getContent())
                .mediaUrl(message.getMediaUrl())
                .isRead(message.isRead())
                .createdAt(message.getCreatedAt())
                .build();
    }
}

