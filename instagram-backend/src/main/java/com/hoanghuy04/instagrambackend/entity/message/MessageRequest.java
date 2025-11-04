package com.hoanghuy04.instagrambackend.entity.message;

import com.hoanghuy04.instagrambackend.entity.Message;
import com.hoanghuy04.instagrambackend.entity.User;
import com.hoanghuy04.instagrambackend.enums.RequestStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.DocumentReference;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Entity representing a message request.
 * Created when users who are not connected try to message each other.
 * 
 * @author Instagram Backend Team
 * @version 2.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "message_requests")
@CompoundIndex(name = "receiver_status_idx", def = "{'receiver': 1, 'status': 1}")
public class MessageRequest {
    
    /**
     * Unique identifier for the message request
     */
    @Id
    private String id;
    
    /**
     * Reference to the user who sent the request
     */
    @DocumentReference
    private User sender;
    
    /**
     * Reference to the user who receives the request
     */
    @DocumentReference
    @Indexed
    private User receiver;
    
    /**
     * Status of the request (PENDING, ACCEPTED, REJECTED, IGNORED)
     */
    private RequestStatus status;
    
    /**
     * Reference to the first message in this request
     */
    @DocumentReference
    private Message firstMessage;
    
    /**
     * List of pending message IDs waiting for approval
     */
    @Builder.Default
    private List<String> pendingMessageIds = new ArrayList<>();
    
    /**
     * Timestamp when the request was created
     */
    @CreatedDate
    private LocalDateTime createdAt;
    
    /**
     * Timestamp when the request was responded to
     */
    private LocalDateTime respondedAt;
}


