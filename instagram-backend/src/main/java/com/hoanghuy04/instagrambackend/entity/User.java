package com.hoanghuy04.instagrambackend.entity;

import com.hoanghuy04.instagrambackend.enums.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Entity representing a user in the Instagram application.
 * Contains user account information, profile details, and relationships.
 * 
 * @author Instagram Backend Team
 * @version 1.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "users")
public class User {
    
    /**
     * Unique identifier for the user
     */
    @Id
    private String id;
    
    /**
     * Unique username for the user
     */
    @Indexed(unique = true)
    private String username;
    
    /**
     * Unique email address
     */
    @Indexed(unique = true)
    private String email;
    
    /**
     * Encrypted password
     */
    private String password;
    
    /**
     * User's extended profile information
     */
    private UserProfile profile;
    
    /**
     * Set of user roles (USER, ADMIN, MODERATOR)
     */
    @Builder.Default
    private Set<UserRole> roles = new HashSet<>();
    
    /**
     * Flag indicating if the account is private
     */
    @Builder.Default
    private boolean isPrivate = false;
    
    /**
     * Flag indicating if the account is verified
     */
    @Builder.Default
    private boolean isVerified = false;
    
    /**
     * Flag indicating if the account is active
     */
    @Builder.Default
    private boolean isActive = true;

    @Builder.Default
    private long followersCount = 0L;

    @Builder.Default
    private long followingCount = 0L;

    /**
     * Timestamp when the user was created
     */
    @CreatedDate
    private LocalDateTime createdAt;
    
    /**
     * Timestamp when the user was last updated
     */
    @LastModifiedDate
    private LocalDateTime updatedAt;
}

