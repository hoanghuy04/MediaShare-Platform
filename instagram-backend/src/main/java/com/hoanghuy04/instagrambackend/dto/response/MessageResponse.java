package com.hoanghuy04.instagrambackend.dto.response;

import com.hoanghuy04.instagrambackend.enums.MessageType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO for message response data.
 * The meaning of 'content' depends on 'type':
 * - TEXT: content is the actual text message
 * - IMAGE: content is the mediaFileId of an image
 * - VIDEO: content is the mediaFileId of a video
 * - AUDIO: content is the mediaFileId of an audio clip
 * - POST_SHARE: content is the postId of a shared post
 * 
 * @author Instagram Backend Team
 * @version 2.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageResponse {
    
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
    private UserSummaryResponse sender;

    /**
     * Information about the receiver
     */
    private UserSummaryResponse receiver;
    
    /**
     * Type of the message (TEXT, IMAGE, VIDEO, AUDIO, POST_SHARE)
     */
    private MessageType type;
    
    /**
     * Content of the message. Meaning depends on type:
     * - TEXT: actual text content
     * - IMAGE/VIDEO/AUDIO: mediaFileId
     * - POST_SHARE: postId
     */
    private String content;
    
    /**
     * List of user IDs who have read this message
     */
    private List<String> readBy;
    
    /**
     * Information about the message this is replying to (threading)
     */
    private MessageResponse replyTo;
    
    /**
     * Timestamp when the message was created
     */
    private LocalDateTime createdAt;
    
    /**
     * Whether this message was deleted by the current user
     */
    private boolean isDeleted;

    private PostResponse postResponse;
}


