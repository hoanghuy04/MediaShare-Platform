package com.hoanghuy04.instagrambackend.repository;

import com.hoanghuy04.instagrambackend.entity.Like;
import com.hoanghuy04.instagrambackend.entity.Post;
import com.hoanghuy04.instagrambackend.entity.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository interface for Like entity operations.
 * Provides CRUD operations and custom queries for like management.
 * 
 * @author Instagram Backend Team
 * @version 1.0.0
 */
@Repository
public interface LikeRepository extends MongoRepository<Like, String> {
    
    /**
     * Find a like by user and post.
     *
     * @param user the user who liked the post
     * @param post the post that was liked
     * @return Optional containing the like if found
     */
    Optional<Like> findByUserAndPost(User user, Post post);
    
    /**
     * Find a like by user ID and post ID.
     *
     * @param userId the ID of the user
     * @param postId the ID of the post
     * @return Optional containing the like if found
     */
    Optional<Like> findByUserIdAndPostId(String userId, String postId);
    
    /**
     * Find all likes for a specific post.
     *
     * @param post the post to find likes for
     * @return List of likes on the post
     */
    List<Like> findByPost(Post post);
    
    /**
     * Find all likes by a specific user.
     *
     * @param user the user who created the likes
     * @return List of likes by the user
     */
    List<Like> findByUser(User user);
    
    /**
     * Check if a user has liked a post.
     *
     * @param user the user to check
     * @param post the post to check
     * @return true if the user has liked the post, false otherwise
     */
    boolean existsByUserAndPost(User user, Post post);
    
    /**
     * Count likes for a specific post.
     *
     * @param post the post to count likes for
     * @return number of likes on the post
     */
    long countByPost(Post post);
    
    /**
     * Delete a like by user and post.
     *
     * @param user the user who liked the post
     * @param post the post that was liked
     */
    void deleteByUserAndPost(User user, Post post);
    
    /**
     * Delete all likes for a specific post.
     *
     * @param post the post whose likes should be deleted
     */
    void deleteByPost(Post post);
}

