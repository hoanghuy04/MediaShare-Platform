package com.hoanghuy04.instagrambackend.service.like;

import com.hoanghuy04.instagrambackend.dto.response.UserResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service interface for like operations.
 * Handles liking and unliking posts and comments.
 * 
 * @author Instagram Backend Team
 * @version 1.0.0
 */
@Service
public interface LikeService {
    
    /**
     * Like a post.
     *
     * @param postId the post ID
     * @param userId the user ID liking the post
     */
    @Transactional
    void likePost(String postId, String userId);

    /**
     * Unlike a post.
     *
     * @param postId the post ID
     * @param userId the user ID unliking the post
     */
    @Transactional
    void unlikePost(String postId, String userId);

    /**
     * Like a comment.
     *
     * @param commentId the comment ID
     * @param userId the user ID liking the comment
     */
    @Transactional
    void likeComment(String commentId, String userId);

    /**
     * Unlike a comment.
     *
     * @param commentId the comment ID
     * @param userId the user ID unliking the comment
     */
    @Transactional
    void unlikeComment(String commentId, String userId);

    /**
     * Get users who liked a post.
     *
     * @param postId the post ID
     * @return List of UserResponse
     */
    @Transactional(readOnly = true)
    List<UserResponse> getPostLikes(String postId);
}
