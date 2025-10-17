package com.hoanghuy04.instagrambackend.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.DocumentReference;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Entity representing a post in the Instagram application.
 * Contains post content, media, and engagement metrics.
 * 
 * @author Instagram Backend Team
 * @version 1.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "posts")
public class Post {
    
    /**
     * Unique identifier for the post
     */
    @Id
    private String id;
    
    /**
     * Reference to the user who created this post
     */
    @DocumentReference
    @Indexed
    private User author;
    
    /**
     * Post caption/description
     */
    private String caption;
    
    /**
     * List of media items (images/videos) in this post
     */
    @Builder.Default
    private List<Media> media = new ArrayList<>();
    
    /**
     * List of user IDs who liked this post
     */
    @Builder.Default
    private List<String> likes = new ArrayList<>();
    
    /**
     * List of comment IDs associated with this post
     */
    @Builder.Default
    private List<String> comments = new ArrayList<>();
    
    /**
     * List of hashtags in this post
     */
    @Builder.Default
    private List<String> tags = new ArrayList<>();
    
    /**
     * Location where the post was created
     */
    private String location;
    
    /**
     * Timestamp when the post was created
     */
    @CreatedDate
    @Indexed
    private LocalDateTime createdAt;
    
    /**
     * Timestamp when the post was last updated
     */
    @LastModifiedDate
    private LocalDateTime updatedAt;
}

