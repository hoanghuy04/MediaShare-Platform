package com.hoanghuy04.instagrambackend.controller.post;

import com.hoanghuy04.instagrambackend.dto.request.CreatePostRequest;
import com.hoanghuy04.instagrambackend.dto.response.ApiResponse;
import com.hoanghuy04.instagrambackend.dto.response.PageResponse;
import com.hoanghuy04.instagrambackend.dto.response.PostResponse;
import com.hoanghuy04.instagrambackend.enums.PostType;
import com.hoanghuy04.instagrambackend.service.post.PostService;
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
     * @return ResponseEntity with PostResponse
     */
    @PostMapping
    @Operation(summary = "Create a new post")
    public ResponseEntity<ApiResponse<PostResponse>> createPost(
            @Valid @RequestBody CreatePostRequest request) {
        log.info("Create post request received");
        
        PostResponse response = postService.createPost(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Post created successfully", response));
    }
    
    /**
     * Get post by ID.
     *
     * @param id the post ID
     * @return ResponseEntity with PostResponse
     */
    @GetMapping("/{id}")
    @Operation(summary = "Get post by ID")
    public ResponseEntity<ApiResponse<PostResponse>> getPost(
            @PathVariable String id) {
        log.info("Get post request received for ID: {}", id);
        
        PostResponse response = postService.getPost(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    /**
     * Get all posts with pagination.
     *
     * @param pageable pagination information
     * @return ResponseEntity with PageResponse of PostResponse
     */
    @GetMapping
    @Operation(summary = "Get all posts")
    public ResponseEntity<ApiResponse<PageResponse<PostResponse>>> getAllPosts(
            Pageable pageable) {
        log.info("Get all posts request received");
        
        PageResponse<PostResponse> response = postService.getAllPosts(pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    /**
     * Get user's posts.
     *
     * @param userId the user ID
     * @param pageable pagination information
     * @return ResponseEntity with PageResponse of PostResponse
     */
    @GetMapping("/user/{userId}")
    @Operation(summary = "Get user's posts")
    public ResponseEntity<ApiResponse<PageResponse<PostResponse>>> getUserPosts(
            @PathVariable String userId,
            Pageable pageable) {
        log.info("Get user posts request received for user: {}", userId);
        
        PageResponse<PostResponse> response = postService.getUserPosts(userId, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    /**
     * Get user's feed.
     *
     * @param pageable pagination information
     * @return ResponseEntity with PageResponse of PostResponse
     */
    @GetMapping("/feed")
    @Operation(summary = "Get user's feed")
    public ResponseEntity<ApiResponse<PageResponse<PostResponse>>> getFeed(
            Pageable pageable) {
        log.info("Get feed request received");
        
        PageResponse<PostResponse> response = postService.getFeedPosts(pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Get user's feed.
     *
     * @param pageable pagination information
     * @return ResponseEntity with PageResponse of PostResponse
     */
    @GetMapping("/reels")
    public PageResponse<PostResponse> getReels(
            Pageable pageable
    ) {
        return postService.getPostsByType(PostType.REEL, pageable);
    }


    /**
     * Get explore posts.
     *
     * @param pageable pagination information
     * @return ResponseEntity with PageResponse of PostResponse
     */
    @GetMapping("/explore")
    @Operation(summary = "Get explore posts")
    public ResponseEntity<ApiResponse<PageResponse<PostResponse>>> getExplore(
            Pageable pageable) {
        log.info("Get explore posts request received");
        
        PageResponse<PostResponse> response = postService.getExplore(pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    /**
     * Update a post.
     *
     * @param id the post ID
     * @param request the update request
     * @return ResponseEntity with updated PostResponse
     */
    @PutMapping("/{id}")
    @Operation(summary = "Update a post")
    public ResponseEntity<ApiResponse<PostResponse>> updatePost(
            @PathVariable String id,
            @Valid @RequestBody CreatePostRequest request) {
        log.info("Update post request received for ID: {}", id);
        
        PostResponse response = postService.updatePost(id, request);
        return ResponseEntity.ok(ApiResponse.success("Post updated successfully", response));
    }
    
    /**
     * Delete a post.
     *
     * @param id the post ID
     * @return ResponseEntity with success message
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a post")
    public ResponseEntity<ApiResponse<Void>> deletePost(
            @PathVariable String id) {
        log.info("Delete post request received for ID: {}", id);
        
        postService.deletePost(id);
        return ResponseEntity.ok(ApiResponse.success("Post deleted successfully", null));
    }

}

