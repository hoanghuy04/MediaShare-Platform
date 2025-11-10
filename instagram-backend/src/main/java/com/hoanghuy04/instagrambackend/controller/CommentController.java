package com.hoanghuy04.instagrambackend.controller;

import com.hoanghuy04.instagrambackend.dto.request.CreateCommentRequest;
import com.hoanghuy04.instagrambackend.dto.response.ApiResponse;
import com.hoanghuy04.instagrambackend.dto.response.CommentResponse;
import com.hoanghuy04.instagrambackend.dto.response.PageResponse;
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
    
    private final CommentServiceImpl commentService;
    
    /**
     * Create a new comment.
     *
     * @param request the comment creation request
     * @param userId the user ID creating the comment
     * @return ResponseEntity with CommentResponse
     */
    @PostMapping
    @Operation(summary = "Create a new comment")
    public ResponseEntity<ApiResponse<CommentResponse>> createComment(
            @Valid @RequestBody CreateCommentRequest request,
            @RequestParam String userId) {
        log.info("Create comment request received from user: {}", userId);
        
        CommentResponse response = commentService.createComment(request, userId);
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
     * @param userId the user ID updating the comment
     * @return ResponseEntity with updated CommentResponse
     */
    @PutMapping("/{id}")
    @Operation(summary = "Update a comment")
    public ResponseEntity<ApiResponse<CommentResponse>> updateComment(
            @PathVariable String id,
            @RequestParam String text,
            @RequestParam String userId) {
        log.info("Update comment request received for ID: {}", id);
        
        CommentResponse response = commentService.updateComment(id, text, userId);
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
        
        commentService.deleteComment(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Comment deleted successfully", null));
    }
    
    /**
     * Reply to a comment.
     *
     * @param id the comment ID to reply to
     * @param request the comment request
     * @param userId the user ID creating the reply
     * @return ResponseEntity with CommentResponse
     */
    @PostMapping("/{id}/replies")
    @Operation(summary = "Reply to a comment")
    public ResponseEntity<ApiResponse<CommentResponse>> replyToComment(
            @PathVariable String id,
            @Valid @RequestBody CreateCommentRequest request,
            @RequestParam String userId) {
        log.info("Reply to comment request received for comment: {}", id);
        
        CommentResponse response = commentService.replyToComment(id, request, userId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Reply created successfully", response));
    }
    
    /**
     * Like a comment.
     *
     * @param id the comment ID
     * @param userId the user ID liking the comment
     * @return ResponseEntity with success message
     */
    @PostMapping("/{id}/like")
    @Operation(summary = "Like a comment")
    public ResponseEntity<ApiResponse<Void>> likeComment(
            @PathVariable String id,
            @RequestParam String userId) {
        log.info("Like comment request received for comment: {}", id);
        
        commentService.likeComment(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Comment liked successfully", null));
    }
    
    /**
     * Unlike a comment.
     *
     * @param id the comment ID
     * @param userId the user ID unliking the comment
     * @return ResponseEntity with success message
     */
    @DeleteMapping("/{id}/like")
    @Operation(summary = "Unlike a comment")
    public ResponseEntity<ApiResponse<Void>> unlikeComment(
            @PathVariable String id,
            @RequestParam String userId) {
        log.info("Unlike comment request received for comment: {}", id);
        
        commentService.unlikeComment(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Comment unliked successfully", null));
    }
}

