package com.hoanghuy04.instagrambackend.entity.message;

import com.hoanghuy04.instagrambackend.enums.ConversationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Entity representing a conversation between users.
 * Can be either DIRECT (1-1) or GROUP (multiple participants).
 * 
 * @author Instagram Backend Team
 * @version 2.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "conversations")
@CompoundIndex(name = "participants_userId_idx", def = "{'participants.userId': 1}")
@CompoundIndex(name = "type_participants_idx", def = "{'type': 1, 'participants.userId': 1}")
@CompoundIndex(
    name = "direct_participants_normalized_unique_idx",
    def = "{'type': 1, 'participantsNormalized': 1}",
    unique = true,
    partialFilter = "{'type': 'DIRECT'}"
)
public class Conversation {
    
    /**
     * Unique identifier for the conversation
     */
    @Id
    private String id;
    
    /**
     * Type of conversation (DIRECT or GROUP)
     */
    private ConversationType type;
    
    /**
     * Name of the group (null for DIRECT conversations)
     */
    private String name;
    
    /**
     * Avatar URL of the group (null for DIRECT conversations)
     */
    private String avatar;
    
    /**
     * List of participants with their details (username, avatar, role, etc.)
     * Replaces the old 'participants' (List<String>) and 'members' fields
     */
    @Builder.Default
    private List<ConversationMember> participants = new ArrayList<>();

    /**
     * Normalized participant IDs (sorted) for enforcing uniqueness on DIRECT conversations
     */
    @Builder.Default
    private List<String> participantsNormalized = new ArrayList<>();
    
    /**
     * List of admin user IDs (only for GROUP conversations)
     */
    @Builder.Default
    private List<String> admins = new ArrayList<>();
    
    /**
     * User ID who created the conversation
     */
    private String createdBy;
    
    /**
     * List of members who left the conversation
     */
    @Builder.Default
    private List<ConversationMember> leftMembers = new ArrayList<>();
    
    /**
     * List of user IDs who deleted this conversation (soft delete)
     * When a user deletes a conversation, it's hidden from their list but remains visible to others
     */
    @Builder.Default
    private List<String> deletedBy = new ArrayList<>();
    
    /**
     * Timestamp when the conversation was created
     */
    @CreatedDate
    private LocalDateTime createdAt;
    
    /**
     * Timestamp when the conversation was last modified
     */
    @LastModifiedDate
    private LocalDateTime updatedAt;
    
    /**
     * Information about the last message in the conversation
     */
    private LastMessageInfo lastMessage;
}

