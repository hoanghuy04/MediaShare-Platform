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
 * Entity representing a like on a post.
 * Tracks which users liked which posts.
 * 
 * @author Instagram Backend Team
 * @version 1.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "likes")
@CompoundIndex(name = "user_post_idx", def = "{'user': 1, 'post': 1}", unique = true)
public class Like {
    
    /**
     * Unique identifier for the like
     */
    @Id
    private String id;
    
    /**
     * Reference to the user who liked the post
     */
    @DocumentReference
    private User user;
    
    /**
     * Reference to the post that was liked
     */
    @DocumentReference
    private Post post;
    
    /**
     * Timestamp when the like was created
     */
    @CreatedDate
    private LocalDateTime createdAt;
}

