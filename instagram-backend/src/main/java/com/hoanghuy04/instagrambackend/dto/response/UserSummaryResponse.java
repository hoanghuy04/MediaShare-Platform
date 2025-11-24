package com.hoanghuy04.instagrambackend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for user summary information.
 * Lightweight version of UserResponse for messages and conversations.
 * 
 * @author Instagram Backend Team
 * @version 2.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSummaryResponse {
    
    /**
     * User ID
     */
    private String id;
    
    /**
     * Username
     */
    private String username;
    
    /**
     * Avatar URL
     */
    private String avatar;
    
    /**
     * Whether the account is verified
     */
    private boolean isVerified;
    
    /**
     * Whether the current user is following this user
     */
    private boolean followingByCurrentUser;
}


