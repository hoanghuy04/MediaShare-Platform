package com.hoanghuy04.instagrambackend.entity.message;

import com.hoanghuy04.instagrambackend.enums.MemberRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Embedded class representing a member in a conversation.
 * Tracks member participation, roles, and join/leave times.
 * 
 * @author Instagram Backend Team
 * @version 2.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConversationMember {
    
    /**
     * Reference to the user ID
     */
    private String userId;
    
    /**
     * Timestamp when the member joined the conversation
     */
    private LocalDateTime joinedAt;
    
    /**
     * Timestamp when the member left the conversation (null if still active)
     */
    private LocalDateTime leftAt;
    
    /**
     * Role of the member (ADMIN or MEMBER)
     */
    private MemberRole role;
}


