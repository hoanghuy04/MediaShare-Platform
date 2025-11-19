package com.hoanghuy04.instagrambackend.dto.response;

import com.hoanghuy04.instagrambackend.enums.MemberRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for conversation member data.
 * Contains user info and participation details.
 * 
 * @author Instagram Backend Team
 * @version 2.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConversationMemberDTO {
    
    /**
     * User ID
     */
    private String userId;
    
    /**
     * Username
     */
    private String username;
    
    /**
     * Avatar URL
     */
    private String avatar;
    
    /**
     * Whether the user is verified
     */
    private boolean isVerified;
    
    /**
     * Timestamp when the member joined
     */
    private LocalDateTime joinedAt;
    
    /**
     * Timestamp when the member left (null if still active)
     */
    private LocalDateTime leftAt;
    
    /**
     * Member role (ADMIN or MEMBER)
     */
    private MemberRole role;
}

