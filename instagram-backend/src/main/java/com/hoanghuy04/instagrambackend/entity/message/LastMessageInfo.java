package com.hoanghuy04.instagrambackend.entity.message;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Embedded class representing the last message in a conversation.
 * Used for quick display in conversation lists without loading all messages.
 * 
 * @author Instagram Backend Team
 * @version 2.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LastMessageInfo {
    
    /**
     * ID of the last message
     */
    private String messageId;
    
    /**
     * Content preview of the last message
     */
    private String content;
    
    /**
     * ID of the user who sent the last message
     */
    private String senderId;
    
    /**
     * Timestamp when the last message was created
     */
    private LocalDateTime timestamp;
}


