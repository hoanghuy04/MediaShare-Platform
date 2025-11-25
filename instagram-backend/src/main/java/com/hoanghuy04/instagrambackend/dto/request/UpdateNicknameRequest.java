package com.hoanghuy04.instagrambackend.dto.request;

import lombok.Data;

/**
 * Request DTO for updating a member's nickname in a conversation.
 * 
 * @author Instagram Backend Team
 * @version 2.0.0
 */
@Data
public class UpdateNicknameRequest {
    
    /**
     * The user ID whose nickname is being updated
     */
    private String targetUserId;
    
    /**
     * The new nickname. If null or empty, the nickname will be reset (removed).
     */
    private String nickname;
}

