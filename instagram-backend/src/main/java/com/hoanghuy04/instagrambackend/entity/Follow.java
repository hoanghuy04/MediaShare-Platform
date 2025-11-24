package com.hoanghuy04.instagrambackend.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * Follow relationship between two users.
 * Instead of DocumentReference, we store plain IDs + denormalized usernames
 * to keep the schema simple and queries efficient.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "follows")
public class Follow {

    @Id
    private String id;

    /**
     * ID of the user who follows (follower).
     */
    @Indexed
    private String followerId;

    /**
     * ID of the user being followed.
     */
    @Indexed
    private String followingId;

    /**
     * Denormalized username of follower (for search).
     */
    @Indexed
    private String followerUsername;

    /**
     * Denormalized username of following (for search).
     */
    @Indexed
    private String followingUsername;

    /**
     * Timestamp when the follow relationship was created.
     */
    @CreatedDate
    @Indexed
    private LocalDateTime createdAt;
}
