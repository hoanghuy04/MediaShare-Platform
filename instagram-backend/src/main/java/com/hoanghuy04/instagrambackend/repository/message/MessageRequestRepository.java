package com.hoanghuy04.instagrambackend.repository.message;

import com.hoanghuy04.instagrambackend.entity.message.MessageRequest;
import com.hoanghuy04.instagrambackend.enums.RequestStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository interface for MessageRequest entity operations.
 * Provides CRUD operations and custom queries for message request management.
 * 
 * @author Instagram Backend Team
 * @version 2.0.0
 */
@Repository
public interface MessageRequestRepository extends MongoRepository<MessageRequest, String> {
    
    /**
     * Get pending requests for a user
     *
     * @param receiverId the ID of the user who receives the requests
     * @param status the status to filter by
     * @return List of message requests
     */
    List<MessageRequest> findByReceiverIdAndStatusOrderByCreatedAtDesc(
        String receiverId, 
        RequestStatus status
    );
    
    /**
     * Check if a pending request exists between two users
     *
     * @param senderId the ID of the user who sent the request
     * @param receiverId the ID of the user who receives the request
     * @param status the status to filter by
     * @return Optional message request if found
     */
    Optional<MessageRequest> findBySenderIdAndReceiverIdAndStatus(
        String senderId, 
        String receiverId, 
        RequestStatus status
    );
    
    /**
     * Count pending requests for a user
     *
     * @param receiverId the ID of the user
     * @param status the status to count
     * @return number of requests with the given status
     */
    long countByReceiverIdAndStatus(String receiverId, RequestStatus status);
    
    /**
     * Get all requests sent by a user
     *
     * @param senderId the ID of the user who sent the requests
     * @return List of message requests
     */
    List<MessageRequest> findBySenderIdOrderByCreatedAtDesc(String senderId);
    
    /**
     * Find active request between two users (any status)
     *
     * @param senderId the ID of the sender
     * @param receiverId the ID of the receiver
     * @return Optional message request if found
     */
    Optional<MessageRequest> findBySenderIdAndReceiverId(String senderId, String receiverId);
}


