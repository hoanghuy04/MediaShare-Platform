package com.hoanghuy04.instagrambackend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for sending a new message.
 * Supports both direct messages and conversation-based messages.
 * 
 * @author Instagram Backend Team
 * @version 2.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SendMessageRequest {
    
    /**
     * For direct messages: the receiver user ID
     * For existing conversations: leave null
     */
    private String receiverId;
    
    /**
     * For existing conversations: the conversation ID
     * For direct messages: leave null
     */
    private String conversationId;
    
    /**
     * The message text content
     */
    @NotBlank(message = "Message content is required")
    @Size(max = 1000, message = "Message must not exceed 1000 characters")
    private String content;
    
    /**
     * Optional URL to media attachment
     */
    private String mediaUrl;
    
    /**
     * Optional: ID of message this is replying to (threading)
     */
    private String replyToMessageId;
}


