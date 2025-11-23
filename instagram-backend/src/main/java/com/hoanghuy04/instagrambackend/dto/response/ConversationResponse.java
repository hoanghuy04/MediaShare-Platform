package com.hoanghuy04.instagrambackend.dto.response;

import com.hoanghuy04.instagrambackend.entity.conversation.ConversationMember;
import com.hoanghuy04.instagrambackend.entity.conversation.LastMessageInfo;
import com.hoanghuy04.instagrambackend.enums.ConversationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO for conversation response data.
 * 
 * @author Instagram Backend Team
 * @version 2.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConversationResponse {
    
    /**
     * Conversation ID
     */
    private String id;
    
    /**
     * Type of conversation (DIRECT or GROUP)
     */
    private ConversationType type;
    
    /**
     * Name of the group (null for DIRECT)
     */
    private String name;
    
    /**
     * Avatar URL of the group (null for DIRECT)
     */
    private String avatar;
    
    /**
     * List of participants in the conversation with their roles and join times
     */
    private List<ConversationMember> participants;
    
    /**
     * List of admin user IDs (only for group conversations)
     */
    private List<String> admins;

    /**
     * Information about the last message
     */
    private LastMessageInfo lastMessage;
    
    /**
     * Timestamp when the conversation was created
     */
    private LocalDateTime createdAt;
}


