package com.hoanghuy04.instagrambackend.dto.websocket;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for WebSocket chat messages.
 * Used for real-time message transmission.
 * 
 * @author Instagram Backend Team
 * @version 1.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessage {
    
    /**
     * Message ID (generated after saving to DB)
     */
    private String id;
    
    /**
     * Type of WebSocket message (CHAT, JOIN, LEAVE, TYPING, etc.)
     */
    private MessageType type;
    
    /**
     * Content type for CHAT messages (TEXT, IMAGE, VIDEO, AUDIO, POST_SHARE).
     * Only used when type == CHAT.
     */
    private com.hoanghuy04.instagrambackend.enums.MessageType contentType;
    
    /**
     * Sender user ID
     */
    private String senderId;
    
    /**
     * Sender username
     */
    private String senderUsername;
    
    /**
     * Sender profile image URL
     */
    private String senderProfileImage;
    
    /**
     * Receiver user ID
     */
    private String receiverId;
    
    /**
     * Conversation ID (for group chat support)
     */
    private String conversationId;
    
    /**
     * Message content
     */
    private String content;
    
    /**
     * Media URL (optional)
     */
    private String mediaUrl;
    
    /**
     * Timestamp when message was sent
     */
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();
    
    /**
     * Message status
     */
    @Builder.Default
    private MessageStatus status = MessageStatus.SENT;
    
    /**
     * Enum for message types
     */
    public enum MessageType {
        CHAT,           // Regular chat message
        JOIN,           // User joined
        LEAVE,          // User left
        TYPING,         // User is typing
        STOP_TYPING,    // User stopped typing
        READ            // Message read notification
    }
    
    /**
     * Enum for message status
     */
    public enum MessageStatus {
        SENT,           // Message sent
        DELIVERED,      // Message delivered to recipient
        READ            // Message read by recipient
    }
}

