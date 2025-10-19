package com.hoanghuy04.instagrambackend.controller;

import com.hoanghuy04.instagrambackend.dto.request.CreatePostRequest;
import com.hoanghuy04.instagrambackend.dto.response.ApiResponse;
import com.hoanghuy04.instagrambackend.dto.response.PageResponse;
import com.hoanghuy04.instagrambackend.dto.response.PostResponse;
import com.hoanghuy04.instagrambackend.service.PostService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for post management endpoints.
 * Handles post creation, updates, and queries.
 * 
 * @author Instagram Backend Team
 * @version 1.0.0
 */
@Slf4j
@RestController
@RequestMapping("/posts")
@RequiredArgsConstructor
@Tag(name = "Posts", description = "Post management APIs")
@SecurityRequirement(name = "Bearer Authentication")
public class PostController {
    
    private final PostService postService;
    
    /**
     * Create a new post.
     *
     * @param request the post creation request
     * @param userId the user ID creating the post
     * @return ResponseEntity with PostResponse
     */
    @PostMapping
    @Operation(summary = "Create a new post")
    public ResponseEntity<ApiResponse<PostResponse>> createPost(
            @Valid @RequestBody CreatePostRequest request,
            @RequestParam String userId) {
        log.info("Create post request received from user: {}", userId);
        
        PostResponse response = postService.createPost(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Post created successfully", response));
    }
    
    /**
     * Get post by ID.
     *
     * @param id the post ID
     * @param userDetails the authenticated user details
     * @return ResponseEntity with PostResponse
     */
    @GetMapping("/{id}")
    @Operation(summary = "Get post by ID")
    public ResponseEntity<ApiResponse<PostResponse>> getPost(
            @PathVariable String id,
            @AuthenticationPrincipal UserDetails userDetails) {
        log.info("Get post request received for ID: {}", id);
        
        String currentUserId = userDetails != null ? userDetails.getUsername() : null;
        PostResponse response = postService.getPost(id, currentUserId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    /**
     * Get all posts with pagination.
     *
     * @param pageable pagination information
     * @param userDetails the authenticated user details
     * @return ResponseEntity with PageResponse of PostResponse
     */
    @GetMapping
    @Operation(summary = "Get all posts")
    public ResponseEntity<ApiResponse<PageResponse<PostResponse>>> getAllPosts(
            Pageable pageable,
            @AuthenticationPrincipal UserDetails userDetails) {
        log.info("Get all posts request received");
        
        String currentUserId = userDetails != null ? userDetails.getUsername() : null;
        PageResponse<PostResponse> response = postService.getAllPosts(pageable, currentUserId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    /**
     * Get user's posts.
     *
     * @param userId the user ID
     * @param pageable pagination information
     * @param userDetails the authenticated user details
     * @return ResponseEntity with PageResponse of PostResponse
     */
    @GetMapping("/user/{userId}")
    @Operation(summary = "Get user's posts")
    public ResponseEntity<ApiResponse<PageResponse<PostResponse>>> getUserPosts(
            @PathVariable String userId,
            Pageable pageable,
            @AuthenticationPrincipal UserDetails userDetails) {
        log.info("Get user posts request received for user: {}", userId);
        
        String currentUserId = userDetails != null ? userDetails.getUsername() : null;
        PageResponse<PostResponse> response = postService.getUserPosts(userId, pageable, currentUserId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    /**
     * Get user's feed.
     *
     * @param userId the user ID
     * @param pageable pagination information
     * @return ResponseEntity with PageResponse of PostResponse
     */
    @GetMapping("/feed")
    @Operation(summary = "Get user's feed")
    public ResponseEntity<ApiResponse<PageResponse<PostResponse>>> getFeed(
            @RequestParam String userId,
            Pageable pageable) {

        PageResponse<PostResponse> response = postService.getFeedPosts(userId, pageable);
        log.info("Feed posts retrieved: {}", response);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    /**
     * Get explore posts.
     *
     * @param pageable pagination information
     * @param userDetails the authenticated user details
     * @return ResponseEntity with PageResponse of PostResponse
     */
    @GetMapping("/explore")
    @Operation(summary = "Get explore posts")
    public ResponseEntity<ApiResponse<PageResponse<PostResponse>>> getExplore(
            Pageable pageable,
            @AuthenticationPrincipal UserDetails userDetails) {
        log.info("Get explore posts request received");
        
        String currentUserId = userDetails != null ? userDetails.getUsername() : null;
        PageResponse<PostResponse> response = postService.getExplore(pageable, currentUserId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    /**
     * Update a post.
     *
     * @param id the post ID
     * @param request the update request
     * @param userId the user ID updating the post
     * @return ResponseEntity with updated PostResponse
     */
    @PutMapping("/{id}")
    @Operation(summary = "Update a post")
    public ResponseEntity<ApiResponse<PostResponse>> updatePost(
            @PathVariable String id,
            @Valid @RequestBody CreatePostRequest request,
            @RequestParam String userId) {
        log.info("Update post request received for ID: {}", id);
        
        PostResponse response = postService.updatePost(id, request, userId);
        return ResponseEntity.ok(ApiResponse.success("Post updated successfully", response));
    }
    
    /**
     * Delete a post.
     *
     * @param id the post ID
     * @param userId the user ID deleting the post
     * @return ResponseEntity with success message
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a post")
    public ResponseEntity<ApiResponse<Void>> deletePost(
            @PathVariable String id,
            @RequestParam String userId) {
        log.info("Delete post request received for ID: {}", id);
        
        postService.deletePost(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Post deleted successfully", null));
    }
    
    /**
     * Like a post.
     *
     * @param id the post ID
     * @param userId the user ID liking the post
     * @return ResponseEntity with success message
     */
    @PostMapping("/{id}/like")
    @Operation(summary = "Like a post")
    public ResponseEntity<ApiResponse<Void>> likePost(
            @PathVariable String id,
            @RequestParam String userId) {
        log.info("Like post request received for post: {}", id);
        
        postService.likePost(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Post liked successfully", null));
    }
    
    /**
     * Unlike a post.
     *
     * @param id the post ID
     * @param userId the user ID unliking the post
     * @return ResponseEntity with success message
     */
    @DeleteMapping("/{id}/like")
    @Operation(summary = "Unlike a post")
    public ResponseEntity<ApiResponse<Void>> unlikePost(
            @PathVariable String id,
            @RequestParam String userId) {
        log.info("Unlike post request received for post: {}", id);
        
        postService.unlikePost(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Post unliked successfully", null));
    }
}

