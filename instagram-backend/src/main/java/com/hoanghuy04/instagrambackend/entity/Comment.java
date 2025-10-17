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
 * Entity representing a comment on a post or reply to another comment.
 * Supports nested replies through self-referencing.
 * 
 * @author Instagram Backend Team
 * @version 1.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "comments")
public class Comment {
    
    /**
     * Unique identifier for the comment
     */
    @Id
    private String id;
    
    /**
     * Reference to the post this comment belongs to
     */
    @DocumentReference
    @Indexed
    private Post post;
    
    /**
     * Reference to the user who created this comment
     */
    @DocumentReference
    @Indexed
    private User author;
    
    /**
     * The comment text content
     */
    private String text;
    
    /**
     * List of user IDs who liked this comment
     */
    @Builder.Default
    private List<String> likes = new ArrayList<>();
    
    /**
     * List of reply comment IDs (nested comments)
     */
    @Builder.Default
    private List<String> replies = new ArrayList<>();
    
    /**
     * Timestamp when the comment was created
     */
    @CreatedDate
    private LocalDateTime createdAt;
    
    /**
     * Timestamp when the comment was last updated
     */
    @LastModifiedDate
    private LocalDateTime updatedAt;
}

