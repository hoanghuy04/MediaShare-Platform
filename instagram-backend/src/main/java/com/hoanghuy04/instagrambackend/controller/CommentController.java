package com.hoanghuy04.instagrambackend.controller;

import com.hoanghuy04.instagrambackend.dto.request.CreateCommentRequest;
import com.hoanghuy04.instagrambackend.dto.response.ApiResponse;
import com.hoanghuy04.instagrambackend.dto.response.CommentResponse;
import com.hoanghuy04.instagrambackend.dto.response.PageResponse;
import com.hoanghuy04.instagrambackend.service.comment.CommentService;
import com.hoanghuy04.instagrambackend.service.comment.CommentServiceImpl;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for comment management endpoints.
 * Handles comment creation, updates, and queries.
 * 
 * @author Instagram Backend Team
 * @version 1.0.0
 */
@Slf4j
@RestController
@RequestMapping("/comments")
@RequiredArgsConstructor
@Tag(name = "Comments", description = "Comment management APIs")
@SecurityRequirement(name = "Bearer Authentication")
public class CommentController {
    
    private final CommentService commentService;

    /**
     * Create a new comment.
     *
     * @param request the comment creation request
     * @return ResponseEntity with CommentResponse
     */
    @PostMapping
    @Operation(summary = "Create a new comment")
    public ResponseEntity<ApiResponse<CommentResponse>> createComment(
            @Valid @RequestBody CreateCommentRequest request
            ) {
        CommentResponse response = commentService.createComment(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Comment created successfully", response));
    }
    
    /**
     * Get comment by ID.
     *
     * @param id the comment ID
     * @return ResponseEntity with CommentResponse
     */
    @GetMapping("/{id}")
    @Operation(summary = "Get comment by ID")
    public ResponseEntity<ApiResponse<CommentResponse>> getComment(@PathVariable String id) {
        log.info("Get comment request received for ID: {}", id);
        
        CommentResponse response = commentService.getComment(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Get comments for a post.
     *
     * @param postId the post ID
     * @param pageable pagination information
     * @return ResponseEntity with PageResponse of CommentResponse
     */
    @GetMapping("/post/{postId}")
    @Operation(summary = "Get post comments")
    public ResponseEntity<ApiResponse<PageResponse<CommentResponse>>> getPostComments(
            @PathVariable String postId,
            Pageable pageable) {
        log.info("Get post comments request received for post: {}", postId);

        PageResponse<CommentResponse> response = commentService.getPostComments(postId, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    /**
     * Update a comment.
     *
     * @param id the comment ID
     * @param text the new comment text
     * @return ResponseEntity with updated CommentResponse
     */
    @PutMapping("/{id}")
    @Operation(summary = "Update a comment")
    public ResponseEntity<ApiResponse<CommentResponse>> updateComment(
            @PathVariable String id,
            @RequestParam String text
            ) {
        log.info("Update comment request received for ID: {}", id);
        
        CommentResponse response = commentService.updateComment(id, text);
        return ResponseEntity.ok(ApiResponse.success("Comment updated successfully", response));
    }
    
    /**
     * Delete a comment.
     *
     * @param id the comment ID
     * @param userId the user ID deleting the comment
     * @return ResponseEntity with success message
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a comment")
    public ResponseEntity<ApiResponse<Void>> deleteComment(
            @PathVariable String id,
            @RequestParam String userId) {
        log.info("Delete comment request received for ID: {}", id);
        
        commentService.deleteComment(id);
        return ResponseEntity.ok(ApiResponse.success("Comment deleted successfully", null));
    }
    
    /**
     * Reply to a comment.
     *
     * @param id the comment ID to reply to
     * @param request the comment request
     * @return ResponseEntity with CommentResponse
     */
    @PostMapping("/{id}/replies")
    @Operation(summary = "Reply to a comment")
    public ResponseEntity<ApiResponse<CommentResponse>> replyToComment(
            @PathVariable String id,
            @Valid @RequestBody CreateCommentRequest request
            ) {
        log.info("Reply to comment request received for comment: {}", id);

        CommentResponse response = commentService.replyToComment(id, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Reply created successfully", response));
    }

    @PostMapping("{id}/like")
    public ResponseEntity<ApiResponse<Boolean>> toggleLikeComment(@PathVariable String id) {

        boolean isLiked = commentService.toggleLikeComment(id);

        return ResponseEntity.ok(
                ApiResponse.success(
                        isLiked ? "Liked" : "Unliked",
                        isLiked
                )
        );
    }

    @GetMapping("/{id}/replies")
    @Operation(summary = "Get comment replies")
    public ResponseEntity<ApiResponse<List<CommentResponse>>> getCommentReplies(
            @PathVariable String id) {
        log.info("Get replies for comment: {}", id);

        List<CommentResponse> responses = commentService.getCommentReplies(id);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

}

