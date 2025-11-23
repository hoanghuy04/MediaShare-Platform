package com.hoanghuy04.instagrambackend.controller.post;

import com.hoanghuy04.instagrambackend.dto.request.CommentCreateRequest;
import com.hoanghuy04.instagrambackend.dto.response.*;
import com.hoanghuy04.instagrambackend.service.post.PostCommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

/*
 * @description: PostCommentController
 * @author: Trần Ngọc Huyền
 * @date: 11/23/2025
 * @version: 1.0
 */
@RestController
@RequestMapping("/posts")
@RequiredArgsConstructor
public class PostCommentController {

    private final PostCommentService postCommentService;

    @PostMapping("/{postId}/comments")
    public ResponseEntity<ApiResponse<CommentResponse>> createComment(
            @PathVariable String postId,
            @RequestBody @Valid CommentCreateRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(postCommentService.createComment(postId, request)));
    }

    @GetMapping("/{postId}/comments")
    public ResponseEntity<ApiResponse<PageResponse<CommentResponse>>> getComments(
            @PathVariable String postId,
            @PageableDefault(
                    sort = {"pinned", "createdAt"},
                    direction = Sort.Direction.DESC
            ) Pageable pageable
    ) {
        return ResponseEntity.ok(ApiResponse.success(postCommentService.getComments(postId, pageable)));
    }

    @GetMapping("/{postId}/comments/{commentId}/replies")
    public ResponseEntity<ApiResponse<PageResponse<CommentResponse>>> getReplies(
            @PathVariable String postId,
            @PathVariable String commentId,
            @PageableDefault(
                    sort = "createdAt",
                    direction = Sort.Direction.DESC
            ) Pageable pageable
    ) {
        return ResponseEntity.ok(ApiResponse.success(postCommentService.getReplies(postId, commentId, pageable)));
    }

    @PostMapping("/{postId}/comments/{commentId}/like")
    public ResponseEntity<ApiResponse<CommentLikeToggleResponse>> toggleLikeComment(
            @PathVariable String postId,
            @PathVariable String commentId
    ) {
        return ResponseEntity.ok(ApiResponse.success(postCommentService.toggleLikeComment(postId, commentId)));
    }

    @DeleteMapping("/{postId}/comments/{commentId}")
    public ResponseEntity<ApiResponse<Void>> deleteComment(
            @PathVariable String postId,
            @PathVariable String commentId
    ) {
        postCommentService.deleteComment(postId, commentId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/{postId}/comments/{commentId}/pin")
    public ResponseEntity<ApiResponse<CommentPinToggleResponse>> togglePinComment(
            @PathVariable String postId,
            @PathVariable String commentId
    ) {
        CommentPinToggleResponse result = postCommentService.togglePinComment(postId, commentId);
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
