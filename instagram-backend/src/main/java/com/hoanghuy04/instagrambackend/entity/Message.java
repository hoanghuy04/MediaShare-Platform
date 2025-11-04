package com.hoanghuy04.instagrambackend.entity;

import com.hoanghuy04.instagrambackend.entity.message.Conversation;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.DocumentReference;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Entity representing a message between users.
 * Supports text and media content, threading, read receipts, and soft delete.
 * 
 * @author Instagram Backend Team
 * @version 2.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "messages")
@CompoundIndex(name = "sender_receiver_idx", def = "{'sender': 1, 'receiver': 1}")
@CompoundIndex(name = "conversation_created_idx", def = "{'conversation': 1, 'createdAt': -1}")
public class Message {
    
    /**
     * Unique identifier for the message
     */
    @Id
    private String id;
    
    /**
     * Reference to the conversation this message belongs to
     */
    @DocumentReference
    @Indexed
    private Conversation conversation;
    
    /**
     * Reference to the user who sent the message
     */
    @DocumentReference
    private User sender;
    
    /**
     * DEPRECATED: Reference to the user who receives the message
     * Kept for migration compatibility - use conversation.participants instead
     */
    @DocumentReference
    private User receiver;
    
    /**
     * The message text content
     */
    private String content;
    
    /**
     * Optional URL to media attachment
     */
    private String mediaUrl;
    
    /**
     * NEW: List of user IDs who have read this message
     * Used for multi-user read receipts in group chats
     */
    @Builder.Default
    private List<String> readBy = new ArrayList<>();
    
    /**
     * DEPRECATED: Flag indicating if the message has been read
     * Kept for migration compatibility - use readBy instead
     */
    @Builder.Default
    private boolean isRead = false;
    
    /**
     * NEW: ID of the message this message is replying to (threading support)
     */
    private String replyToMessageId;
    
    /**
     * NEW: List of user IDs who deleted this message (soft delete)
     */
    @Builder.Default
    private List<String> deletedBy = new ArrayList<>();
    
    /**
     * NEW: Timestamp when the message was deleted
     */
    private LocalDateTime deletedAt;
    
    /**
     * Timestamp when the message was created
     */
    @CreatedDate
    @Indexed
    private LocalDateTime createdAt;
}

