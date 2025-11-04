package com.hoanghuy04.instagrambackend.dto.message.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for last message preview in a conversation.
 * 
 * @author Instagram Backend Team
 * @version 2.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LastMessageDTO {
    
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
     * Username of the sender (for convenience)
     */
    private String senderUsername;
    
    /**
     * Timestamp when the last message was created
     */
    private LocalDateTime timestamp;
}
