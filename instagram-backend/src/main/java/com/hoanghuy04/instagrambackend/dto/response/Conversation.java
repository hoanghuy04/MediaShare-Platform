package com.hoanghuy04.instagrambackend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO representing a conversation between users.
 * 
 * @author Instagram Backend Team
 * @version 1.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Conversation {
    
    private String conversationId;
    
    private UserResponse otherUser;
    
    private MessageResponse lastMessage;
    
    private Integer unreadCount;
    
    private LocalDateTime lastMessageTime;
}

