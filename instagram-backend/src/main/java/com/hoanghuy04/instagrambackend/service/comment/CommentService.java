package com.hoanghuy04.instagrambackend.service.comment;

import com.hoanghuy04.instagrambackend.dto.request.CreateCommentRequest;
import com.hoanghuy04.instagrambackend.dto.response.CommentResponse;
import com.hoanghuy04.instagrambackend.dto.response.PageResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service interface for comment operations.
 * Handles comment creation, updates, and queries.
 * 
 * @author Instagram Backend Team
 * @version 1.0.0
 */
@Service
public interface CommentService {
    
    /**
     * Create a new comment on a post.
     *
     * @param request the comment creation request
     * @param userId the user ID creating the comment
     * @return CommentResponse
     */
    @Transactional
    CommentResponse createComment(CreateCommentRequest request, String userId);

    /**
     * Get comment by ID.
     *
     * @param commentId the comment ID
     * @return CommentResponse
     */
    @Transactional(readOnly = true)
    CommentResponse getComment(String commentId);

    /**
     * Get comments for a post.
     *
     * @param postId the post ID
     * @param pageable pagination information
     * @return PageResponse of CommentResponse
     */
    @Transactional(readOnly = true)
    PageResponse<CommentResponse> getPostComments(String postId, Pageable pageable);

    /**
     * Update a comment.
     *
     * @param commentId the comment ID
     * @param text the new comment text
     * @param userId the user ID updating the comment
     * @return updated CommentResponse
     */
    @Transactional
    CommentResponse updateComment(String commentId, String text, String userId);

    /**
     * Delete a comment.
     *
     * @param commentId the comment ID
     * @param userId the user ID deleting the comment
     */
    @Transactional
    void deleteComment(String commentId, String userId);

    /**
     * Reply to a comment.
     *
     * @param commentId the comment ID to reply to
     * @param request the comment request
     * @param userId the user ID creating the reply
     * @return CommentResponse
     */
    @Transactional
    CommentResponse replyToComment(String commentId, CreateCommentRequest request, String userId);

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
}
