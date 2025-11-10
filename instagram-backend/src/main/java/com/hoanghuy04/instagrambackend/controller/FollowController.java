package com.hoanghuy04.instagrambackend.controller;

import com.hoanghuy04.instagrambackend.dto.response.ApiResponse;
import com.hoanghuy04.instagrambackend.service.follow.FollowServiceImpl;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for follow management endpoints.
 * Handles user follow/unfollow relationships.
 * 
 * @author Instagram Backend Team
 * @version 1.0.0
 */
@Slf4j
@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@Tag(name = "Follow", description = "Follow management APIs")
@SecurityRequirement(name = "Bearer Authentication")
public class FollowController {
    
    private final FollowServiceImpl followService;
    
    /**
     * Follow a user.
     *
     * @param userId the user ID to follow
     * @param followerId the follower user ID
     * @return ResponseEntity with success message
     */
    @PostMapping("/{userId}/follow")
    @Operation(summary = "Follow a user")
    public ResponseEntity<ApiResponse<Void>> followUser(
            @PathVariable String userId,
            @RequestParam String followerId) {
        log.info("Follow user request received for user: {}", userId);
        
        followService.followUser(followerId, userId);
        return ResponseEntity.ok(ApiResponse.success("User followed successfully", null));
    }
    
    /**
     * Unfollow a user.
     *
     * @param userId the user ID to unfollow
     * @param followerId the follower user ID
     * @return ResponseEntity with success message
     */
    @DeleteMapping("/{userId}/follow")
    @Operation(summary = "Unfollow a user")
    public ResponseEntity<ApiResponse<Void>> unfollowUser(
            @PathVariable String userId,
            @RequestParam String followerId) {
        log.info("Unfollow user request received for user: {}", userId);
        
        followService.unfollowUser(followerId, userId);
        return ResponseEntity.ok(ApiResponse.success("User unfollowed successfully", null));
    }
    
    /**
     * Check if following a user.
     *
     * @param userId the user ID to check
     * @param followerId the follower user ID
     * @return ResponseEntity with boolean result
     */
    @GetMapping("/{userId}/is-following")
    @Operation(summary = "Check if following a user")
    public ResponseEntity<ApiResponse<Boolean>> isFollowing(
            @PathVariable String userId,
            @RequestParam String followerId) {
        log.info("Check if following request received for user: {}", userId);
        
        boolean isFollowing = followService.isFollowing(followerId, userId);
        return ResponseEntity.ok(ApiResponse.success(isFollowing));
    }
}

