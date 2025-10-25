package com.hoanghuy04.instagrambackend.repository;

import com.hoanghuy04.instagrambackend.entity.ConversationMetadata;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository interface for ConversationMetadata entity operations.
 * Provides CRUD operations and custom queries for conversation metadata management.
 * 
 * @author Instagram Backend Team
 * @version 1.0.0
 */
@Repository
public interface ConversationMetadataRepository extends MongoRepository<ConversationMetadata, String> {
    
    /**
     * Find conversation metadata by user ID and partner ID.
     *
     * @param userId the user ID
     * @param partnerId the partner ID
     * @return Optional ConversationMetadata
     */
    Optional<ConversationMetadata> findByUserIdAndPartnerId(String userId, String partnerId);
    
    /**
     * Find all conversation metadata for a user that are not deleted.
     *
     * @param userId the user ID
     * @return List of ConversationMetadata
     */
    List<ConversationMetadata> findByUserIdAndIsDeletedFalse(String userId);
    
    /**
     * Find all conversation metadata for a user that are pinned.
     *
     * @param userId the user ID
     * @return List of ConversationMetadata
     */
    List<ConversationMetadata> findByUserIdAndIsPinnedTrue(String userId);
    
    /**
     * Find all conversation metadata for a user.
     *
     * @param userId the user ID
     * @return List of ConversationMetadata
     */
    List<ConversationMetadata> findByUserId(String userId);
    
    /**
     * Find conversation metadata by user ID and partner ID, including deleted ones.
     *
     * @param userId the user ID
     * @param partnerId the partner ID
     * @return Optional ConversationMetadata
     */
    @Query("{'userId': ?0, 'partnerId': ?1}")
    Optional<ConversationMetadata> findByUserIdAndPartnerIdIncludingDeleted(String userId, String partnerId);
    
    /**
     * Find all conversation metadata for a user that are deleted.
     *
     * @param userId the user ID
     * @return List of ConversationMetadata
     */
    List<ConversationMetadata> findByUserIdAndIsDeletedTrue(String userId);
}
