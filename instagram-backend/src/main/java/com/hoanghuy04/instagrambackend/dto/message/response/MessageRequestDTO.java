package com.hoanghuy04.instagrambackend.dto.message.response;

import com.hoanghuy04.instagrambackend.enums.RequestStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for message request response data.
 * 
 * @author Instagram Backend Team
 * @version 2.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageRequestDTO {
    
    /**
     * Message request ID
     */
    private String id;
    
    /**
     * Information about the sender
     */
    private UserSummaryDTO sender;
    
    /**
     * The first message in the request
     */
    private MessageDTO firstMessage;
    
    /**
     * Number of pending messages
     */
    private int pendingCount;
    
    /**
     * Current status of the request
     */
    private RequestStatus status;
    
    /**
     * Timestamp when the request was created
     */
    private LocalDateTime createdAt;
}


