package com.hoanghuy04.instagrambackend.repository;

import com.hoanghuy04.instagrambackend.entity.Message;
import com.hoanghuy04.instagrambackend.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository interface for Message entity operations.
 * Provides CRUD operations and custom queries for message management.
 * 
 * @author Instagram Backend Team
 * @version 2.0.0
 */
@Repository
public interface MessageRepository extends MongoRepository<Message, String> {
    
    // ==================== OLD METHODS (Backward Compatibility) ====================
    
    /**
     * Find messages between two users.
     *
     * @param user1 first user in the conversation
     * @param user2 second user in the conversation
     * @param pageable pagination information
     * @return Page of messages in the conversation
     */
    @Query("{'$or': [" +
           "{'sender': ?0, 'receiver': ?1}, " +
           "{'sender': ?1, 'receiver': ?0}" +
           "]}")
    Page<Message> findConversation(User user1, User user2, Pageable pageable);
    
    /**
     * Find messages between two users by their IDs.
     *
     * @param userId1 first user ID
     * @param userId2 second user ID
     * @param pageable pagination information
     * @return Page of messages in the conversation
     */
    @Query("{ '$or': [ " +
            "{ 'sender': ObjectId(?0), 'receiver': ObjectId(?1) }, " +
            "{ 'sender': ObjectId(?1), 'receiver': ObjectId(?0) } " +
            "] }")
    Page<Message> findConversationByIds(String userId1, String userId2, Pageable pageable);


    /**
     * Find all messages sent to a user.
     *
     * @param receiver the user who received the messages
     * @param pageable pagination information
     * @return Page of received messages
     */
    Page<Message> findByReceiver(User receiver, Pageable pageable);
    
    /**
     * Find all messages sent by a user.
     *
     * @param sender the user who sent the messages
     * @param pageable pagination information
     * @return Page of sent messages
     */
    Page<Message> findBySender(User sender, Pageable pageable);
    
    // ==================== NEW METHODS (Conversation-based) ====================
    
    /**
     * Get messages in conversation (excluding deleted by user)
     *
     * @param conversationId the conversation ID
     * @param userId the user ID to exclude deleted messages for
     * @param pageable pagination information
     * @return List of messages not deleted by the user
     */
    List<Message> findByConversationIdAndDeletedByNotContainingOrderByCreatedAtDesc(
        String conversationId, 
        String userId,
        Pageable pageable
    );

    List<Message> findByConversationId(String conversationId);
    
    /**
     * Find messages deleted by all participants (for cleanup)
     *
     * @param conversationId the conversation ID
     * @return List of fully deleted messages
     */
    @Query("{ 'conversation.$id': ?0, $expr: { $eq: [{ $size: '$deletedBy' }, { $size: '$conversation.participants' }] } }")
    List<Message> findFullyDeletedMessages(String conversationId);
    
    /**
     * Get latest message in conversation
     *
     * @param conversationId the conversation ID
     * @return Optional containing the latest message
     */
    Optional<Message> findFirstByConversationIdOrderByCreatedAtDesc(String conversationId);
    
    /**
     * Find messages between sender and receiver (OLD: Keep for compatibility)
     *
     * @param sender the sender user
     * @param receiver the receiver user
     * @return List of messages
     */
    List<Message> findBySenderAndReceiverOrderByCreatedAtDesc(User sender, User receiver);
    
    /**
     * Find messages by list of IDs.
     * Used for loading pending messages from message requests.
     *
     * @param ids list of message IDs
     * @return List of messages matching the IDs
     */
    List<Message> findByIdIn(List<String> ids);

    /**
     * Find messages in a conversation ordered by creation date descending
     *
     * @param conversationId the conversation ID
     * @return List of messages in the conversation
     */
    List<Message> findByConversation_IdOrderByCreatedAtDesc(String conversationId);

    /**
     * Delete all messages in a conversation
     *
     * @param conversationId the conversation ID
     */
    void deleteByConversation_Id(String conversationId);
}
