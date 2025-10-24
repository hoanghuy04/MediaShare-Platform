package com.hoanghuy04.instagrambackend.controller;

import com.hoanghuy04.instagrambackend.dto.websocket.ChatMessage;
import com.hoanghuy04.instagrambackend.dto.websocket.ChatMessage.MessageType;
import com.hoanghuy04.instagrambackend.entity.Message;
import com.hoanghuy04.instagrambackend.entity.User;
import com.hoanghuy04.instagrambackend.repository.MessageRepository;
import com.hoanghuy04.instagrambackend.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.time.LocalDateTime;

/**
 * WebSocket controller for real-time messaging.
 * Handles STOMP messages for chat functionality.
 * 
 * @author Instagram Backend Team
 * @version 1.0.0
 */
@Slf4j
@Controller
@RequiredArgsConstructor
public class WebSocketMessageController {

    private final SimpMessagingTemplate messagingTemplate;
    private final MessageRepository messageRepository;
    private final UserService userService;

    /**
     * Handle private chat messages.
     * Endpoint: /app/chat.send
     * 
     * @param chatMessage the chat message
     * @param headerAccessor STOMP header accessor
     */
    @MessageMapping("/chat.send")
    public void sendMessage(@Payload ChatMessage chatMessage, SimpMessageHeaderAccessor headerAccessor) {
        try {
            log.info("Received chat message from {} to {}", chatMessage.getSenderId(), chatMessage.getReceiverId());
            
            // Get sender and receiver
            User sender = userService.getUserEntityById(chatMessage.getSenderId());
            User receiver = userService.getUserEntityById(chatMessage.getReceiverId());
            
            // Save message to database
            Message message = Message.builder()
                    .sender(sender)
                    .receiver(receiver)
                    .content(chatMessage.getContent())
                    .mediaUrl(chatMessage.getMediaUrl())
                    .isRead(false)
                    .build();
            
            message = messageRepository.save(message);
            
            // Set message ID and timestamp
            chatMessage.setId(message.getId());
            chatMessage.setTimestamp(message.getCreatedAt());
            chatMessage.setType(MessageType.CHAT);
            chatMessage.setStatus(ChatMessage.MessageStatus.SENT);
            
            // Set sender info
            chatMessage.setSenderUsername(sender.getUsername());
            chatMessage.setSenderProfileImage(sender.getProfile() != null ? sender.getProfile().getAvatar() : null);
            
            // Send to receiver via WebSocket
            messagingTemplate.convertAndSendToUser(
                    chatMessage.getReceiverId(),
                    "/queue/messages",
                    chatMessage
            );
            
            // Send confirmation back to sender
            messagingTemplate.convertAndSendToUser(
                    chatMessage.getSenderId(),
                    "/queue/messages",
                    chatMessage
            );
            
            log.info("Message sent successfully: {}", message.getId());
            
        } catch (Exception e) {
            log.error("Error sending message: {}", e.getMessage(), e);
            
            // Send error back to sender
            ChatMessage errorMessage = ChatMessage.builder()
                    .type(MessageType.CHAT)
                    .content("Failed to send message: " + e.getMessage())
                    .timestamp(LocalDateTime.now())
                    .build();
            
            messagingTemplate.convertAndSendToUser(
                    chatMessage.getSenderId(),
                    "/queue/errors",
                    errorMessage
            );
        }
    }

    /**
     * Handle typing indicator.
     * Endpoint: /app/chat.typing
     * 
     * @param chatMessage the typing indicator message
     */
    @MessageMapping("/chat.typing")
    public void handleTyping(@Payload ChatMessage chatMessage) {
        log.debug("User {} is typing to {}", chatMessage.getSenderId(), chatMessage.getReceiverId());
        
        chatMessage.setType(MessageType.TYPING);
        chatMessage.setTimestamp(LocalDateTime.now());
        
        // Notify receiver that sender is typing
        messagingTemplate.convertAndSendToUser(
                chatMessage.getReceiverId(),
                "/queue/typing",
                chatMessage
        );
    }

    /**
     * Handle stop typing indicator.
     * Endpoint: /app/chat.stopTyping
     * 
     * @param chatMessage the stop typing indicator message
     */
    @MessageMapping("/chat.stopTyping")
    public void handleStopTyping(@Payload ChatMessage chatMessage) {
        log.debug("User {} stopped typing to {}", chatMessage.getSenderId(), chatMessage.getReceiverId());
        
        chatMessage.setType(MessageType.STOP_TYPING);
        chatMessage.setTimestamp(LocalDateTime.now());
        
        // Notify receiver that sender stopped typing
        messagingTemplate.convertAndSendToUser(
                chatMessage.getReceiverId(),
                "/queue/typing",
                chatMessage
        );
    }

    /**
     * Handle message read notification.
     * Endpoint: /app/chat.read
     * 
     * @param chatMessage the read notification message
     */
    @MessageMapping("/chat.read")
    public void handleMessageRead(@Payload ChatMessage chatMessage) {
        try {
            log.info("Marking message {} as read", chatMessage.getId());
            
            // Update message in database
            Message message = messageRepository.findById(chatMessage.getId())
                    .orElseThrow(() -> new RuntimeException("Message not found"));
            
            message.setRead(true);
            messageRepository.save(message);
            
            chatMessage.setType(MessageType.READ);
            chatMessage.setStatus(ChatMessage.MessageStatus.READ);
            chatMessage.setTimestamp(LocalDateTime.now());
            
            // Notify sender that message was read
            messagingTemplate.convertAndSendToUser(
                    chatMessage.getSenderId(),
                    "/queue/read-receipts",
                    chatMessage
            );
            
        } catch (Exception e) {
            log.error("Error marking message as read: {}", e.getMessage(), e);
        }
    }

    /**
     * Handle user join notification.
     * Endpoint: /app/chat.join
     * 
     * @param chatMessage the join notification
     * @param headerAccessor STOMP header accessor
     */
    @MessageMapping("/chat.join")
    public void handleUserJoin(@Payload ChatMessage chatMessage, SimpMessageHeaderAccessor headerAccessor) {
        log.info("User {} joined chat", chatMessage.getSenderId());
        
        // Store username in WebSocket session
        headerAccessor.getSessionAttributes().put("username", chatMessage.getSenderUsername());
        
        chatMessage.setType(MessageType.JOIN);
        chatMessage.setTimestamp(LocalDateTime.now());
        
        // Notify receiver that user came online
        if (chatMessage.getReceiverId() != null) {
            messagingTemplate.convertAndSendToUser(
                    chatMessage.getReceiverId(),
                    "/queue/presence",
                    chatMessage
            );
        }
    }
}

