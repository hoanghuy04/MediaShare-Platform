package com.hoanghuy04.instagrambackend.entity;

import com.hoanghuy04.instagrambackend.enums.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.DocumentReference;

import java.time.LocalDateTime;

/**
 * Entity representing a notification for user activities.
 * Tracks likes, comments, follows, and messages.
 * 
 * @author Instagram Backend Team
 * @version 1.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "notifications")
public class Notification {
    
    /**
     * Unique identifier for the notification
     */
    @Id
    private String id;
    
    /**
     * Reference to the user receiving the notification
     */
    @DocumentReference
    @Indexed
    private User user;
    
    /**
     * Type of notification (LIKE, COMMENT, FOLLOW, MESSAGE)
     */
    private NotificationType type;
    
    /**
     * Reference to the user who triggered this notification
     */
    @DocumentReference
    private User relatedUser;
    
    /**
     * Optional reference to related post
     */
    @DocumentReference
    private Post relatedPost;
    
    /**
     * Notification message text
     */
    private String message;
    
    /**
     * Flag indicating if the notification has been read
     */
    @Builder.Default
    private boolean isRead = false;
    
    /**
     * Timestamp when the notification was created
     */
    @CreatedDate
    @Indexed
    private LocalDateTime createdAt;
}

