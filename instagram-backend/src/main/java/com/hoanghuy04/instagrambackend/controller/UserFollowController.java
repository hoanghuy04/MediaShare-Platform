package com.hoanghuy04.instagrambackend.controller;

import com.hoanghuy04.instagrambackend.dto.response.ApiResponse;
import com.hoanghuy04.instagrambackend.dto.response.FollowerUserResponse;
import com.hoanghuy04.instagrambackend.dto.response.FollowToggleResponse;
import com.hoanghuy04.instagrambackend.dto.response.PageResponse;
import com.hoanghuy04.instagrambackend.dto.response.PostLikeUserResponse;
import com.hoanghuy04.instagrambackend.service.follow.FollowService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserFollowController {

    private final FollowService followService;

    @PostMapping("/{targetUserId}/follow")
    public ResponseEntity<ApiResponse<FollowToggleResponse>> toggleFollow(
            @PathVariable String targetUserId
    ) {
        FollowToggleResponse response = followService.toggleFollow(targetUserId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{userId}/followers")
    public ResponseEntity<ApiResponse<PageResponse<PostLikeUserResponse>>> getFollowers(
            @PathVariable String userId,
            @PageableDefault(
                    sort = "createdAt",
                    direction = Sort.Direction.DESC
            ) Pageable pageable
    ) {
        PageResponse<PostLikeUserResponse> result = followService.getFollowers(userId, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/{userId}/following")
    public ResponseEntity<ApiResponse<PageResponse<PostLikeUserResponse>>> getFollowing(
            @PathVariable String userId,
            @PageableDefault(
                    sort = "createdAt",
                    direction = Sort.Direction.DESC
            ) Pageable pageable
    ) {
        PageResponse<PostLikeUserResponse> result = followService.getFollowing(userId, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/{targetUserId}/is-following")
    public ResponseEntity<ApiResponse<Boolean>> isFollowing(
            @PathVariable String targetUserId
    ) {
        boolean following = followService.isFollowing(targetUserId);
        return ResponseEntity.ok(ApiResponse.success(following));
    }

    @GetMapping("/{userId}/followers/search")
    public ResponseEntity<ApiResponse<PageResponse<FollowerUserResponse>>> searchFollowers(
            @PathVariable String userId,
            @RequestParam(required = false, defaultValue = "") String username,
            @PageableDefault(
                    sort = "createdAt",
                    direction = Sort.Direction.DESC
            ) Pageable pageable
    ) {
        PageResponse<FollowerUserResponse> result = followService.searchFollowers(userId, username, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/{userId}/following/search")
    public ResponseEntity<ApiResponse<PageResponse<PostLikeUserResponse>>> searchFollowing(
            @PathVariable String userId,
            @RequestParam(required = false, defaultValue = "") String username,
            @PageableDefault(
                    sort = "createdAt",
                    direction = Sort.Direction.DESC
            ) Pageable pageable
    ) {
        PageResponse<PostLikeUserResponse> result = followService.searchFollowing(userId, username, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @DeleteMapping("/followers/{followerId}")
    public ResponseEntity<ApiResponse<Void>> removeFollower(
            @PathVariable String followerId
    ) {
        followService.removeFollower(followerId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
