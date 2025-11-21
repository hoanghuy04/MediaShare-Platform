package com.hoanghuy04.instagrambackend.controller;

import com.hoanghuy04.instagrambackend.dto.request.UpdateUserRequest;
import com.hoanghuy04.instagrambackend.dto.response.ApiResponse;
import com.hoanghuy04.instagrambackend.dto.response.PageResponse;
import com.hoanghuy04.instagrambackend.dto.response.UserResponse;
import com.hoanghuy04.instagrambackend.dto.response.UserStatsResponse;
import com.hoanghuy04.instagrambackend.dto.response.UserSummaryDTO;
import com.hoanghuy04.instagrambackend.service.user.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for user management endpoints.
 * Handles user profile operations and queries.
 * 
 * @author Instagram Backend Team
 * @version 1.0.0
 */
@Slf4j
@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "User management APIs")
@SecurityRequirement(name = "Bearer Authentication")
public class UserController {
    
    private final UserService userService;
    
    /**
     * Get user by ID.
     *
     * @param id the user ID
     * @return ResponseEntity with UserResponse
     */
    @GetMapping("/{id}")
    @Operation(summary = "Get user by ID")
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(@PathVariable String id) {
        log.info("Get user request received for ID: {}", id);
        UserResponse response = userService.getUserById(id);
        log.info("response_________________________________________: {}", response);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    /**
     * Get all users with pagination.
     *
     * @param pageable pagination information
     * @return ResponseEntity with PageResponse of UserResponse
     */
    @GetMapping
    @Operation(summary = "Get all users")
    public ResponseEntity<ApiResponse<PageResponse<UserResponse>>> getAllUsers(Pageable pageable) {
        log.info("Get all users request received");
        
        PageResponse<UserResponse> response = userService.getAllUsers(pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    /**
     * Update user profile.
     *
     * @param id the user ID
     * @param request the update request
     * @return ResponseEntity with updated UserResponse
     */
    @PutMapping("/{id}")
    @Operation(summary = "Update user profile")
    @PreAuthorize("@userServiceImpl.getUserEntityById(#id).username == authentication.name")
    public ResponseEntity<ApiResponse<UserResponse>> updateUser(
            @PathVariable String id,
            @Valid @RequestBody UpdateUserRequest request) {
        log.info("Update user request received for ID: {}", id);
        
        UserResponse response = userService.updateUser(id, request);
        return ResponseEntity.ok(ApiResponse.success("User updated successfully", response));
    }
    
    /**
     * Delete user account.
     *
     * @param id the user ID
     * @return ResponseEntity with success message
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "Delete user account")
    @PreAuthorize("@userServiceImpl.getUserEntityById(#id).username == authentication.name or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable String id) {
        log.info("Delete user request received for ID: {}", id);
        
        userService.deleteUser(id);
        return ResponseEntity.ok(ApiResponse.success("User deleted successfully", null));
    }
    
    /**
     * Get user followers.
     *
     * @param id the user ID
     * @return ResponseEntity with List of UserResponse
     */
    @GetMapping("/{id}/followers")
    @Operation(summary = "Get user followers")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getUserFollowers(@PathVariable String id) {
        log.info("Get followers request received for user: {}", id);
        
        List<UserResponse> response = userService.getUserFollowers(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    /**
     * Get user following list (detailed).
     *
     * @param id the user ID
     * @return ResponseEntity with List of UserResponse
     */
    @GetMapping("/{id}/following")
    @Operation(summary = "Get user following (detailed)")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getUserFollowing(@PathVariable String id) {
        log.info("Get following request received for user: {}", id);
        
        List<UserResponse> response = userService.getUserFollowing(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    /**
     * Get user following summary (lightweight).
     *
     * @param id user ID
     * @param query optional search keyword
     * @param page page number
     * @param size page size
     * @return ResponseEntity with List of UserSummaryDTO
     */
    @GetMapping("/{id}/following-summary")
    @Operation(summary = "Get user following summary")
    public ResponseEntity<ApiResponse<List<UserSummaryDTO>>> getUserFollowingSummary(
            @PathVariable String id,
            @RequestParam(required = false, defaultValue = "") String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        log.info("Get following summary request received for user: {} with query: {}", id, query);
        List<UserSummaryDTO> response = userService.getUserFollowingSummary(id, query, page, size);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    /**
     * Search users.
     *
     * @param query the search query
     * @param pageable pagination information
     * @return ResponseEntity with PageResponse of UserResponse
     */
    @GetMapping("/search")
    @Operation(summary = "Search users")
    public ResponseEntity<ApiResponse<PageResponse<UserResponse>>> searchUsers(
            @RequestParam String query,
            Pageable pageable) {
        log.info("Search users request received with query: {}", query);

        PageResponse<UserResponse> response = userService.searchUsers(query, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    /**
     * Get user statistics.
     *
     * @param id the user ID
     * @return ResponseEntity with UserStatsResponse
     */
    @GetMapping("/{id}/stats")
    @Operation(summary = "Get user statistics")
    public ResponseEntity<ApiResponse<UserStatsResponse>> getUserStats(@PathVariable String id) {
        log.info("Get user stats request received for user: {}", id);
        
        UserStatsResponse response = userService.getUserStats(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    /**
     * Get mutual follows for a user (users that both follow each other).
     *
     * @param userId the user ID
     * @param query the search query (optional, filters by username, firstName, lastName)
     * @param page the page number (0-indexed, default: 0)
     * @param size the page size (default: 20)
     * @return ResponseEntity with List of UserResponse
     */
    @GetMapping("/{userId}/mutual-follows")
    @Operation(summary = "Get mutual follows for a user")
    public ResponseEntity<ApiResponse<List<UserSummaryDTO>>> getMutualFollows(
            @PathVariable String userId,
            @RequestParam(required = false, defaultValue = "") String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        log.info("Get mutual follows for user {} with query: {}", userId, query);
        List<UserSummaryDTO> mutuals = userService.getMutualFollows(userId, query, page, size);
        return ResponseEntity.ok(
            ApiResponse.success("Mutual follows retrieved successfully", mutuals)
        );
    }
}

