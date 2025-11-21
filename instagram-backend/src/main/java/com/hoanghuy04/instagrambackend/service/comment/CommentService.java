package com.hoanghuy04.instagrambackend.service.comment;

import com.hoanghuy04.instagrambackend.dto.request.CreateCommentRequest;
import com.hoanghuy04.instagrambackend.dto.response.CommentResponse;
import com.hoanghuy04.instagrambackend.dto.response.PageResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

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
     * @return CommentResponse
     */
    @Transactional
    CommentResponse createComment(CreateCommentRequest request);

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

    /**
     * Update a comment.
     *
     * @param commentId the comment ID
     * @param text the new comment text
     * @return updated CommentResponse
     */
    @Transactional
    CommentResponse updateComment(String commentId, String text);

    /**
     * Delete a comment.
     *
     * @param commentId the comment ID
     */
    @Transactional
    void deleteComment(String commentId);

    /**
     * Reply to a comment.
     *
     * @param commentId the comment ID to reply to
     * @param request the comment request
     * @return CommentResponse
     */
    @Transactional
    CommentResponse replyToComment(String commentId, CreateCommentRequest request);

    /**
     * Like a comment.
     *
     * @param commentId the comment ID
     */
    @Transactional
    boolean toggleLikeComment(String commentId);

    @Transactional(readOnly = true)
    PageResponse<CommentResponse> getPostComments(String postId, Pageable pageable);

    @Transactional
    List<CommentResponse> getCommentReplies(String commentId);

}
