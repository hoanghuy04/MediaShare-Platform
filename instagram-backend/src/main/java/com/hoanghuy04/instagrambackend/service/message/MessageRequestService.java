package com.hoanghuy04.instagrambackend.service.message;

import com.hoanghuy04.instagrambackend.dto.response.MessageRequestDTO;
import com.hoanghuy04.instagrambackend.entity.Message;
import com.hoanghuy04.instagrambackend.entity.message.Conversation;
import com.hoanghuy04.instagrambackend.entity.message.MessageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service interface for message request operations.
 * Handles message requests for users who are not connected.
 * 
 * @author Instagram Backend Team
 * @version 2.0.0
 */
@Service
public interface MessageRequestService {
    
    /**
     * Create a new message request.
     *
     * @param senderId the sender user ID
     * @param receiverId the receiver user ID
     * @param firstMessage the first message in the request
     * @return MessageRequest entity
     */
    @Transactional
    MessageRequest createMessageRequest(String senderId, String receiverId, Message firstMessage);

    /**
     * Get pending message requests for a user.
     *
     * @param userId the user ID
     * @return List of pending message requests as DTOs
     */
    @Transactional(readOnly = true)
    List<MessageRequestDTO> getPendingRequests(String userId);

    /**
     * Accept a message request.
     * This will create a conversation and move pending messages to it.
     *
     * @param requestId the request ID
     * @param userId the user who accepts the request
     * @return Conversation entity
     */
    @Transactional
    Conversation acceptRequest(String requestId, String userId);

    /**
     * Reject a message request.
     *
     * @param requestId the request ID
     * @param userId the user who rejects the request
     */
    @Transactional
    void rejectRequest(String requestId, String userId);

    /**
     * Ignore a message request.
     *
     * @param requestId the request ID
     * @param userId the user who ignores the request
     */
    @Transactional
    void ignoreRequest(String requestId, String userId);

    /**
     * Get count of pending message requests for a user.
     *
     * @param userId the user ID
     * @return number of pending requests
     */
    @Transactional(readOnly = true)
    int getPendingRequestsCount(String userId);

    /**
     * Add a message to an existing pending request.
     *
     * @param requestId the request ID
     * @param message the message to add
     */
    @Transactional
    void addPendingMessage(String requestId, Message message);

    /**
     * Check if an active request exists between two users.
     *
     * @param senderId the sender ID
     * @param receiverId the receiver ID
     * @return true if active request exists
     */
    @Transactional(readOnly = true)
    boolean hasActiveRequest(String senderId, String receiverId);

    /**
     * Get request by ID.
     *
     * @param requestId the request ID
     * @return MessageRequest entity
     */
    @Transactional(readOnly = true)
    MessageRequest getRequestById(String requestId);
    
    /**
     * Get all pending messages for a message request between sender and receiver.
     * This is used when the sender wants to view their sent messages that haven't been accepted yet.
     *
     * @param senderId the sender user ID
     * @param receiverId the receiver user ID
     * @return List of pending messages as DTOs
     */
    @Transactional(readOnly = true)
    List<com.hoanghuy04.instagrambackend.dto.response.MessageDTO> getPendingMessages(String senderId, String receiverId);
}
