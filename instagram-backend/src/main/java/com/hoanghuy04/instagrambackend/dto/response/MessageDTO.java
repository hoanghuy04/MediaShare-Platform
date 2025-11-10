package com.hoanghuy04.instagrambackend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO for message response data.
 * 
 * @author Instagram Backend Team
 * @version 2.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageDTO {
    
    /**
     * Message ID
     */
    private String id;
    
    /**
     * Conversation ID this message belongs to
     */
    private String conversationId;
    
    /**
     * Information about the sender
     */
    private UserSummaryDTO sender;
    
    /**
     * Message text content
     */
    private String content;
    
    /**
     * Optional media URL
     */
    private String mediaUrl;
    
    /**
     * List of user IDs who have read this message
     */
    private List<String> readBy;
    
    /**
     * Information about the message this is replying to (threading)
     */
    private MessageDTO replyTo;
    
    /**
     * Timestamp when the message was created
     */
    private LocalDateTime createdAt;
    
    /**
     * Whether this message was deleted by the current user
     */
    private boolean isDeleted;
}


