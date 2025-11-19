package com.hoanghuy04.instagrambackend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO representing an item in the inbox.
 * Can be either a Conversation or a MessageRequest.
 * 
 * @author Instagram Backend Team
 * @version 2.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InboxItemDTO {
    
    /**
     * Type of inbox item: CONVERSATION or MESSAGE_REQUEST
     */
    private InboxItemType type;
    
    /**
     * Conversation data (if type is CONVERSATION)
     */
    private ConversationDTO conversation;
    
    /**
     * Message request data (if type is MESSAGE_REQUEST)
     */
    private MessageRequestDTO messageRequest;
    
    /**
     * Timestamp for sorting (conversation.updatedAt or messageRequest.createdAt)
     */
    private LocalDateTime timestamp;
    
    /**
     * Enum for inbox item types
     */
    public enum InboxItemType {
        CONVERSATION,
        MESSAGE_REQUEST
    }
}

