package com.hoanghuy04.instagrambackend.entity;

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

/**
 * Entity representing a direct message between users.
 * Supports text and media content.
 * 
 * @author Instagram Backend Team
 * @version 1.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "messages")
@CompoundIndex(name = "sender_receiver_idx", def = "{'sender': 1, 'receiver': 1}")
public class Message {
    
    /**
     * Unique identifier for the message
     */
    @Id
    private String id;
    
    /**
     * Reference to the user who sent the message
     */
    @DocumentReference
    private User sender;
    
    /**
     * Reference to the user who receives the message
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
     * Flag indicating if the message has been read
     */
    @Builder.Default
    private Boolean isRead = false;
    
    /**
     * Timestamp when the message was created
     */
    @CreatedDate
    @Indexed
    private LocalDateTime createdAt;
}

