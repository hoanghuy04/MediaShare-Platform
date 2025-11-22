package com.hoanghuy04.instagrambackend.controller.post;

/*
 * @description: PostCommentController
 * @author: Trần Ngọc H
 * @date: 11/21/2025
 * @version: 1.0
 */

import com.hoanghuy04.instagrambackend.dto.request.CommentCreateRequest;
import com.hoanghuy04.instagrambackend.dto.response.ApiResponse;
import com.hoanghuy04.instagrambackend.dto.response.CommentLikeToggleResponse;
import com.hoanghuy04.instagrambackend.dto.response.CommentResponse;
import com.hoanghuy04.instagrambackend.dto.response.PageResponse;
import com.hoanghuy04.instagrambackend.service.post.PostCommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
        CommentResponse res = postCommentService.createComment(postId, request);
        return ResponseEntity.ok(ApiResponse.success(res));
    }

    @GetMapping("/{postId}/comments")
    public ResponseEntity<ApiResponse<PageResponse<CommentResponse>>> getComments(
            @PathVariable String postId,
            @PageableDefault(
                    sort = "createdAt",
                    direction = Sort.Direction.DESC
            ) Pageable pageable
    ) {
        PageResponse<CommentResponse> res =
                postCommentService.getComments(postId, pageable);
        return ResponseEntity.ok(ApiResponse.success(res));
    }

    @GetMapping("/{postId}/comments/{commentId}/replies")
    public ResponseEntity<ApiResponse<PageResponse<CommentResponse>>> getReplies(
            @PathVariable String postId,
            @PathVariable String commentId,
            @PageableDefault(
                    sort = "createdAt",
                    direction = Sort.Direction.ASC
            ) Pageable pageable
    ) {
        PageResponse<CommentResponse> res =
                postCommentService.getReplies(postId, commentId, pageable);
        return ResponseEntity.ok(ApiResponse.success(res));
    }

    @PostMapping("/{postId}/comments/{commentId}/like")
    public ResponseEntity<ApiResponse<CommentLikeToggleResponse>> toggleLikeComment(
            @PathVariable String postId,
            @PathVariable String commentId
    ) {
        CommentLikeToggleResponse result =
                postCommentService.toggleLikeComment(postId, commentId);

        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
