package com.hoanghuy04.instagrambackend.controller;

import com.hoanghuy04.instagrambackend.dto.websocket.ChatMessage;
import com.hoanghuy04.instagrambackend.dto.websocket.ChatMessage.MessageType;
import com.hoanghuy04.instagrambackend.entity.Message;
import com.hoanghuy04.instagrambackend.entity.User;
import com.hoanghuy04.instagrambackend.repository.MessageRepository;
import com.hoanghuy04.instagrambackend.service.UserService;
import com.hoanghuy04.instagrambackend.service.message.ConversationMessageService;
import com.hoanghuy04.instagrambackend.service.message.WebSocketMessageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.Map;

/**
 * WebSocket controller for real-time messaging.
 * Handles STOMP messages for chat functionality.
 * Delegates business logic to services.
 * 
 * @author Instagram Backend Team
 * @version 2.0.0
 */
@Slf4j
@Controller
@RequiredArgsConstructor
public class WebSocketMessageController {

    private final MessageRepository messageRepository;
    private final UserService userService;
    private final ConversationMessageService conversationMessageService;
    private final WebSocketMessageService webSocketMessageService;
    private final SimpMessagingTemplate messagingTemplate;

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
            
            // Validate required fields
            if (chatMessage.getSenderId() == null || chatMessage.getReceiverId() == null) {
                log.warn("Invalid chat message: missing senderId or receiverId");
                webSocketMessageService.pushError(
                    chatMessage.getSenderId() != null ? chatMessage.getSenderId() : "unknown",
                    "Invalid message: missing required fields"
                );
                return;
            }
            
            // Get sender and receiver
            User sender = userService.getUserEntityById(chatMessage.getSenderId());
            User receiver = userService.getUserEntityById(chatMessage.getReceiverId());
            
            // Use ConversationMessageService to handle conversation logic
            Message message;
            try {
                message = conversationMessageService.sendMessage(
                    chatMessage.getSenderId(),
                    chatMessage.getReceiverId(),
                    chatMessage.getContent(),
                    chatMessage.getMediaUrl()
                );
                log.info("Message sent via conversation service: {}", message.getId());
            } catch (Exception e) {
                log.error("Failed to send message via conversation service: {}", e.getMessage(), e);
                webSocketMessageService.pushError(chatMessage.getSenderId(), e.getMessage());
                return;
            }
            
            // Push message via WebSocket
            webSocketMessageService.pushMessage(message);
            
            log.info("Message sent successfully: {}", message.getId());
            
        } catch (Exception e) {
            log.error("Error sending message: {}", e.getMessage(), e);
            webSocketMessageService.pushError(
                chatMessage.getSenderId() != null ? chatMessage.getSenderId() : "unknown",
                e.getMessage()
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
        
        if (chatMessage.getSenderId() != null && chatMessage.getReceiverId() != null) {
            webSocketMessageService.pushTypingIndicator(
                chatMessage.getSenderId(),
                chatMessage.getReceiverId(),
                true
            );
        }
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
        
        if (chatMessage.getSenderId() != null && chatMessage.getReceiverId() != null) {
            webSocketMessageService.pushTypingIndicator(
                chatMessage.getSenderId(),
                chatMessage.getReceiverId(),
                false
            );
        }
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
            
            if (chatMessage.getId() == null) {
                log.warn("Invalid read request: message ID is null");
                return;
            }
            
            // Update message in database using unified markAsRead method
            // This will mark the message and all unread messages in the conversation as read
            // and automatically push WebSocket read receipt
            if (chatMessage.getSenderId() != null) {
                conversationMessageService.markAsRead(
                    chatMessage.getId(),
                    chatMessage.getSenderId()
                );
            }
            
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
        Map<String, Object> sessionAttributes = headerAccessor.getSessionAttributes();
        if (sessionAttributes != null && chatMessage.getSenderUsername() != null) {
            sessionAttributes.put("username", chatMessage.getSenderUsername());
        } else if (chatMessage.getSenderUsername() == null) {
            log.warn("SenderUsername is null for user {}", chatMessage.getSenderId());
        }
        
        // Notify receiver that user came online (if receiverId is provided)
        if (chatMessage.getReceiverId() != null) {
            ChatMessage presenceMessage = ChatMessage.builder()
                    .type(MessageType.JOIN)
                    .senderId(chatMessage.getSenderId())
                    .senderUsername(chatMessage.getSenderUsername())
                    .timestamp(java.time.LocalDateTime.now())
                    .build();
            
            messagingTemplate.convertAndSendToUser(
                    chatMessage.getReceiverId(),
                    "/queue/presence",
                    presenceMessage
            );
        }
    }
}

