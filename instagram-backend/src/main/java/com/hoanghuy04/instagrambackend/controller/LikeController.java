package com.hoanghuy04.instagrambackend.controller;

import com.hoanghuy04.instagrambackend.dto.response.ApiResponse;
import com.hoanghuy04.instagrambackend.dto.response.UserResponse;
import com.hoanghuy04.instagrambackend.service.LikeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for like management endpoints.
 * Handles liking and unliking posts and comments.
 * 
 * @author Instagram Backend Team
 * @version 1.0.0
 */
@Slf4j
@RestController
@RequestMapping
@RequiredArgsConstructor
@Tag(name = "Likes", description = "Like management APIs")
@SecurityRequirement(name = "Bearer Authentication")
public class LikeController {
    
    private final LikeService likeService;
    
    /**
     * Like a post.
     *
     * @param postId the post ID
     * @param userId the user ID liking the post
     * @return ResponseEntity with success message
     */
    @PostMapping("/posts/{postId}/like")
    @Operation(summary = "Like a post")
    public ResponseEntity<ApiResponse<Void>> likePost(
            @PathVariable String postId,
            @RequestParam String userId) {
        log.info("Like post request received for post: {}", postId);
        
        likeService.likePost(postId, userId);
        return ResponseEntity.ok(ApiResponse.success("Post liked successfully", null));
    }
    
    /**
     * Unlike a post.
     *
     * @param postId the post ID
     * @param userId the user ID unliking the post
     * @return ResponseEntity with success message
     */
    @DeleteMapping("/posts/{postId}/like")
    @Operation(summary = "Unlike a post")
    public ResponseEntity<ApiResponse<Void>> unlikePost(
            @PathVariable String postId,
            @RequestParam String userId) {
        log.info("Unlike post request received for post: {}", postId);
        
        likeService.unlikePost(postId, userId);
        return ResponseEntity.ok(ApiResponse.success("Post unliked successfully", null));
    }
    
    /**
     * Like a comment.
     *
     * @param commentId the comment ID
     * @param userId the user ID liking the comment
     * @return ResponseEntity with success message
     */
    @PostMapping("/comments/{commentId}/like")
    @Operation(summary = "Like a comment")
    public ResponseEntity<ApiResponse<Void>> likeComment(
            @PathVariable String commentId,
            @RequestParam String userId) {
        log.info("Like comment request received for comment: {}", commentId);
        
        likeService.likeComment(commentId, userId);
        return ResponseEntity.ok(ApiResponse.success("Comment liked successfully", null));
    }
    
    /**
     * Unlike a comment.
     *
     * @param commentId the comment ID
     * @param userId the user ID unliking the comment
     * @return ResponseEntity with success message
     */
    @DeleteMapping("/comments/{commentId}/like")
    @Operation(summary = "Unlike a comment")
    public ResponseEntity<ApiResponse<Void>> unlikeComment(
            @PathVariable String commentId,
            @RequestParam String userId) {
        log.info("Unlike comment request received for comment: {}", commentId);
        
        likeService.unlikeComment(commentId, userId);
        return ResponseEntity.ok(ApiResponse.success("Comment unliked successfully", null));
    }
    
    /**
     * Get users who liked a post.
     *
     * @param postId the post ID
     * @return ResponseEntity with List of UserResponse
     */
    @GetMapping("/posts/{postId}/likes")
    @Operation(summary = "Get post likes")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getPostLikes(@PathVariable String postId) {
        log.info("Get post likes request received for post: {}", postId);
        
        List<UserResponse> response = likeService.getPostLikes(postId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
