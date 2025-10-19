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
        
        log.info("Message sent successfully: {}", message.getId());
        
        // Push message via WebSocket for real-time delivery
        try {
            ChatMessage chatMessage = ChatMessage.builder()
                    .id(message.getId())
                    .type(ChatMessage.MessageType.CHAT)
                    .senderId(sender.getId())
                    .senderUsername(sender.getUsername())
                    .senderProfileImage(sender.getProfile() != null ? sender.getProfile().getAvatar() : null)
                    .receiverId(receiver.getId())
                    .content(message.getContent())
                    .mediaUrl(message.getMediaUrl())
                    .timestamp(message.getCreatedAt())
                    .status(ChatMessage.MessageStatus.SENT)
                    .build();
            
            // Send to receiver
            messagingTemplate.convertAndSendToUser(
                    receiver.getId(),
                    "/queue/messages",
                    chatMessage
            );
            
            log.debug("Message pushed via WebSocket to user: {}", receiver.getId());
        } catch (Exception e) {
            log.warn("Failed to push message via WebSocket: {}", e.getMessage());
            // Don't fail the whole operation if WebSocket push fails
        }
        
        return convertToMessageResponse(message);
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
            Message lastMessage = entry.getValue();
            User otherUser = lastMessage.getSender().getId().equals(userId) 
                    ? lastMessage.getReceiver() 
                    : lastMessage.getSender();
            
            long unreadCount = messageRepository.countByReceiverAndIsReadFalse(user);
            
            Conversation conversation = Conversation.builder()
                    .conversationId(entry.getKey())
                    .otherUser(userService.convertToUserResponse(otherUser))
                    .lastMessage(convertToMessageResponse(lastMessage))
                    .unreadCount((int) unreadCount)
                    .lastMessageTime(lastMessage.getCreatedAt())
                    .build();
            
            conversations.add(conversation);
        }
        
        // Sort by last message time (most recent first)
        conversations.sort((c1, c2) -> c2.getLastMessageTime().compareTo(c1.getLastMessageTime()));
        
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
     * Also pushes read receipt via WebSocket.
     *
     * @param messageId the message ID
     */
    @Transactional
    public void markAsRead(String messageId) {
        log.info("Marking message as read: {}", messageId);
        
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found with id: " + messageId));
        
        message.setIsRead(true);
        messageRepository.save(message);
        
        log.info("Message marked as read successfully");
        
        // Push read receipt via WebSocket
        try {
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
                .isRead(message.getIsRead())
                .createdAt(message.getCreatedAt())
                .build();
    }
}

