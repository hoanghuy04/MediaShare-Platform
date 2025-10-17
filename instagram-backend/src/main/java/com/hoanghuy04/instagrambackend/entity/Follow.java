package com.hoanghuy04.instagrambackend.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.DocumentReference;

import java.time.LocalDateTime;

/**
 * Entity representing a follow relationship between users.
 * Tracks follower-following relationships.
 * 
 * @author Instagram Backend Team
 * @version 1.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "follows")
@CompoundIndex(name = "follower_following_idx", def = "{'follower': 1, 'following': 1}", unique = true)
public class Follow {
    
    /**
     * Unique identifier for the follow relationship
     */
    @Id
    private String id;
    
    /**
     * Reference to the user who is following
     */
    @DocumentReference
    private User follower;
    
    /**
     * Reference to the user being followed
     */
    @DocumentReference
    private User following;
    
    /**
     * Timestamp when the follow relationship was created
     */
    @CreatedDate
    private LocalDateTime createdAt;
}

