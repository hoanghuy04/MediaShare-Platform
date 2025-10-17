package com.hoanghuy04.instagrambackend.service;

import com.hoanghuy04.instagrambackend.dto.request.SendMessageRequest;
import com.hoanghuy04.instagrambackend.dto.response.Conversation;
import com.hoanghuy04.instagrambackend.dto.response.MessageResponse;
import com.hoanghuy04.instagrambackend.entity.Message;
import com.hoanghuy04.instagrambackend.entity.User;
import com.hoanghuy04.instagrambackend.exception.ResourceNotFoundException;
import com.hoanghuy04.instagrambackend.repository.MessageRepository;
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
 * Service class for message operations.
 * Handles direct messaging between users.
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
    
    /**
     * Send a message to a user.
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
        
        return convertToMessageResponse(message);
    }
    
    /**
     * Get conversation between two users.
     *
     * @param userId the current user ID
     * @param otherUserId the other user ID
     * @param pageable pagination information
     * @return Page of MessageResponse
     */
    @Transactional(readOnly = true)
    public Page<MessageResponse> getConversation(String userId, String otherUserId, Pageable pageable) {
        log.debug("Getting conversation between user {} and user: {}", userId, otherUserId);
        
        return messageRepository.findConversationByIds(userId, otherUserId, pageable)
                .map(this::convertToMessageResponse);
    }
    
    /**
     * Get all conversations for a user.
     *
     * @param userId the user ID
     * @return List of Conversation
     */
    @Transactional(readOnly = true)
    public List<Conversation> getConversations(String userId) {
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
        
        return conversations;
    }
    
    /**
     * Mark a message as read.
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

