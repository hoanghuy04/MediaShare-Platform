package com.hoanghuy04.instagrambackend.repository;

import com.hoanghuy04.instagrambackend.entity.Conversation;
import com.hoanghuy04.instagrambackend.enums.ConversationType;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationRepository extends MongoRepository<Conversation, String> {

    @Query("{ 'participants.userId': ?0 }")
    List<Conversation> findByParticipantsContaining(String userId);

    /** Tra DIRECT theo directKey (duy nhất) */
    Optional<Conversation> findByTypeAndDirectKey(ConversationType type, String directKey);

    @Query("{ 'participants.userId': ?0, 'lastMessage.timestamp': { $gt: ?1 } }")
    List<Conversation> findByParticipantsContainingAndLastMessage_TimestampAfter(
            String userId,
            LocalDateTime after
    );

    @Query("{ 'participants.userId': ?0, 'lastMessage.senderId': { $ne: ?0 } }")
    long countUnreadConversations(String userId);

    @Query("{ '_id': ?0, 'participants.userId': ?1 }")
    Optional<Conversation> findByIdAndParticipantsContaining(String conversationId, String userId);

    @Query("{ 'participants.userId': ?0, 'deletedBy': { $nin: [?1] } }")
    List<Conversation> findByParticipantsContainingAndDeletedByNotContaining(String userId, String userId2);
}
