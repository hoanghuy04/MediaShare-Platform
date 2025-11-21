package com.hoanghuy04.instagrambackend.repository.message;

import com.hoanghuy04.instagrambackend.entity.message.Conversation;
import com.hoanghuy04.instagrambackend.enums.ConversationType;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository interface for Conversation entity operations.
 * Provides CRUD operations and custom queries for conversation management.
 * 
 * @author Instagram Backend Team
 * @version 2.0.0
 */
@Repository
public interface ConversationRepository extends MongoRepository<Conversation, String> {
    
    /**
     * Find all conversations that a user is participating in
     *
     * @param userId the user ID to search for
     * @return List of conversations the user is part of
     */
    @Query("{ 'participants.userId': ?0 }")
    List<Conversation> findByParticipantsContaining(String userId);
    
    /**
     * Find a direct conversation between exactly two users
     *
     * @param type the conversation type (should be DIRECT)
     * @param participants list of participant IDs (should contain exactly 2)
     * @return Optional conversation if found
     */
    @Query("{'type': ?0, 'participants.userId': {$all: ?1, $size: ?2}}")
    Optional<Conversation> findByTypeAndParticipants(
        ConversationType type,
        List<String> participants,
        int size
    );

    /**
     * Find a direct conversation by its normalized participant list.
     *
     * @param type the conversation type (DIRECT)
     * @param participantsNormalized sorted list of participant ids (size=2)
     * @return Optional conversation if found
     */
    @Query("{'type': ?0, 'participantsNormalized': ?1}")
    Optional<Conversation> findByTypeAndParticipantsNormalized(
        ConversationType type,
        List<String> participantsNormalized
    );
    
    /**
     * Find conversations with last message after a specific timestamp
     *
     * @param userId the user ID to search for
     * @param after the timestamp threshold
     * @return List of conversations with recent messages
     */
    @Query("{ 'participants.userId': ?0, 'lastMessage.timestamp': { $gt: ?1 } }")
    List<Conversation> findByParticipantsContainingAndLastMessage_TimestampAfter(
        String userId, 
        LocalDateTime after
    );
    
    /**
     * Count unread conversations for a user
     * Unread = last message was not sent by the user
     *
     * @param userId the user ID to count for
     * @return number of unread conversations
     */
    @Query("{ 'participants.userId': ?0, 'lastMessage.senderId': { $ne: ?0 } }")
    long countUnreadConversations(String userId);
    
    /**
     * Find conversation by ID and ensure user is a participant
     *
     * @param conversationId the conversation ID
     * @param userId the user ID to check
     * @return Optional conversation if user is participant
     */
    @Query("{ '_id': ?0, 'participants.userId': ?1 }")
    Optional<Conversation> findByIdAndParticipantsContaining(String conversationId, String userId);
    
    /**
     * Find all conversations that a user is participating in (excluding deleted by user)
     *
     * @param userId the user ID to search for
     * @return List of conversations not deleted by the user
     */
    @Query("{ 'participants.userId': ?0, 'deletedBy': { $nin: [?1] } }")
    List<Conversation> findByParticipantsContainingAndDeletedByNotContaining(String userId, String userId2);
}

