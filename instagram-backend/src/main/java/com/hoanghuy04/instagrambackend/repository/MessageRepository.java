package com.hoanghuy04.instagrambackend.repository;

import com.hoanghuy04.instagrambackend.entity.Message;
import com.hoanghuy04.instagrambackend.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

/**
 * Repository interface for Message entity operations.
 * Provides CRUD operations and custom queries for message management.
 * 
 * @author Instagram Backend Team
 * @version 1.0.0
 */
@Repository
public interface MessageRepository extends MongoRepository<Message, String> {
    
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
    @Query("{'$or': [" +
           "{'sender.$id': ?0, 'receiver.$id': ?1}, " +
           "{'sender.$id': ?1, 'receiver.$id': ?0}" +
           "]}")
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
    
    /**
     * Count unread messages for a user.
     *
     * @param receiver the user to count unread messages for
     * @return number of unread messages
     */
    long countByReceiverAndIsReadFalse(User receiver);
    
    /**
     * Find unread messages for a user.
     *
     * @param receiver the user to find unread messages for
     * @param isRead read status
     * @param pageable pagination information
     * @return Page of unread messages
     */
    Page<Message> findByReceiverAndIsRead(User receiver, boolean isRead, Pageable pageable);
}

