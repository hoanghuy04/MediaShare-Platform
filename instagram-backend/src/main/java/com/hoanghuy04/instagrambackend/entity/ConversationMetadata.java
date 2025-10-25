package com.hoanghuy04.instagrambackend.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * Entity representing conversation metadata for each user.
 * Stores per-user conversation settings like pin status, delete status, etc.
 * 
 * @author Instagram Backend Team
 * @version 1.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "conversation_metadata")
@CompoundIndex(name = "user_partner_idx", def = "{'userId': 1, 'partnerId': 1}", unique = true)
@CompoundIndex(name = "user_deleted_idx", def = "{'userId': 1, 'isDeleted': 1}")
@CompoundIndex(name = "user_pinned_idx", def = "{'userId': 1, 'isPinned': 1}")
public class ConversationMetadata {
    
    /**
     * Unique identifier for the metadata record
     */
    @Id
    private String id;
    
    /**
     * ID of the user who owns this metadata
     */
    @Indexed
    private String userId;
    
    /**
     * ID of the conversation partner (other user in the conversation)
     */
    @Indexed
    private String partnerId;
    
    /**
     * Flag indicating if the conversation is pinned by the user
     */
    @Builder.Default
    private boolean isPinned = false;
    
    /**
     * Flag indicating if the conversation is deleted (hidden) by the user
     */
    @Builder.Default
    private boolean isDeleted = false;
    
    /**
     * Timestamp when the conversation was deleted
     */
    private LocalDateTime deletedAt;
    
    /**
     * Timestamp when the conversation was pinned
     */
    private LocalDateTime pinnedAt;
    
    /**
     * Timestamp of the last interaction in this conversation
     * Used for sorting conversations
     */
    private LocalDateTime lastInteractionAt;
    
    /**
     * Timestamp when the metadata was created
     */
    @CreatedDate
    private LocalDateTime createdAt;
    
    /**
     * Timestamp when the metadata was last updated
     */
    @LastModifiedDate
    private LocalDateTime updatedAt;
}
