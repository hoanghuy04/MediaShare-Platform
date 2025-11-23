package com.hoanghuy04.instagrambackend.enums;

/**
 * Enum representing different types of messages.
 * The meaning of Message.content depends on this type:
 * - TEXT: content is the actual text message
 * - IMAGE: content is the mediaFileId of an image
 * - VIDEO: content is the mediaFileId of a video
 * - POST_SHARE: content is the postId of a shared post
 *
 * @author Instagram Backend Team
 * @version 2.0.0
 */
public enum MessageType {
    /**
     * Text message - content contains the actual text
     */
    TEXT,
    
    /**
     * Image message - content contains the mediaFileId
     */
    IMAGE,
    
    /**
     * Video message - content contains the mediaFileId
     */
    VIDEO,
    
    /**
     * Shared post - content contains the postId
     */
    POST_SHARE
}
