package com.hoanghuy04.instagrambackend.dto.request;

import com.hoanghuy04.instagrambackend.enums.MessageType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for sending a new message.
 * Supports both direct messages and conversation-based messages.
 * The meaning of 'content' depends on 'type':
 * - TEXT: content is the actual text message
 * - IMAGE: content is the mediaFileId of an image
 * - VIDEO: content is the mediaFileId of a video
 * - POST_SHARE: content is the postId of a shared post
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
     * Type of the message (TEXT, IMAGE, VIDEO, POST_SHARE)
     */
    @NotNull(message = "Message type is required")
    @Builder.Default
    private MessageType type = MessageType.TEXT;
    
    /**
     * Content of the message. Meaning depends on type:
     * - TEXT: actual text content
     * - IMAGE/VIDEO: mediaFileId
     * - POST_SHARE: postId
     */
    @NotBlank(message = "Message content is required")
    @Size(max = 1000, message = "Message must not exceed 1000 characters")
    private String content;
    
    /**
     * Optional: ID of message this is replying to (threading)
     */
    private String replyToMessageId;
}


