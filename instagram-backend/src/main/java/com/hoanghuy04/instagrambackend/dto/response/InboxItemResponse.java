package com.hoanghuy04.instagrambackend.dto.response;

import com.hoanghuy04.instagrambackend.dto.request.MessageRequest;
import com.hoanghuy04.instagrambackend.enums.InboxItemType;
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
public class InboxItemResponse {
    
    /**
     * Type of inbox item: CONVERSATION or MESSAGE_REQUEST
     */
    private InboxItemType type;
    
    /**
     * Conversation data (if type is CONVERSATION)
     */
    private ConversationResponse conversation;
    
    /**
     * Message request data (if type is MESSAGE_REQUEST)
     */
    private MessageRequest messageRequest;
    
    /**
     * Timestamp for sorting (conversation.updatedAt or messageRequest.createdAt)
     */
    private LocalDateTime timestamp;
}

