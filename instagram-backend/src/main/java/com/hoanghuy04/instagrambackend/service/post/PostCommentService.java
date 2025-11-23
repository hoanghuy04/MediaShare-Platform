package com.hoanghuy04.instagrambackend.service.post;

import com.hoanghuy04.instagrambackend.dto.request.CommentCreateRequest;
import com.hoanghuy04.instagrambackend.dto.response.CommentLikeToggleResponse;
import com.hoanghuy04.instagrambackend.dto.response.CommentPinToggleResponse;
import com.hoanghuy04.instagrambackend.dto.response.CommentResponse;
import com.hoanghuy04.instagrambackend.dto.response.PageResponse;
import org.springframework.data.domain.Pageable;



public interface PostCommentService {
    CommentResponse createComment(String postId, CommentCreateRequest request);

    PageResponse<CommentResponse> getComments(String postId, Pageable pageable);

    PageResponse<CommentResponse> getReplies(String postId, String parentCommentId, Pageable pageable);

    CommentLikeToggleResponse toggleLikeComment(String postId, String commentId);

    void deleteComment(String postId, String commentId);

    CommentPinToggleResponse togglePinComment(String postId, String commentId);
}
