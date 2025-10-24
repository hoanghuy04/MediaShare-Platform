package com.hoanghuy04.instagrambackend.dto.response;

import com.hoanghuy04.instagrambackend.entity.UserProfile;
import com.hoanghuy04.instagrambackend.enums.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;

/**
 * DTO for user response data.
 * 
 * @author Instagram Backend Team
 * @version 1.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    
    private String id;
    
    private String username;
    
    private String email;
    
    private UserProfile profile;
    
    private Set<UserRole> roles;
    
    private Integer followersCount;
    
    private Integer followingCount;
    
    private boolean isPrivate;
    
    private boolean isVerified;
    
    private boolean isActive;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
}

