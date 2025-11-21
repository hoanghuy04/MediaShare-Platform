package com.hoanghuy04.instagrambackend.controller;

import com.hoanghuy04.instagrambackend.dto.response.ApiResponse;
import com.hoanghuy04.instagrambackend.dto.response.UserResponse;
import com.hoanghuy04.instagrambackend.service.like.LikeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping
@RequiredArgsConstructor
@Tag(name = "Likes", description = "Like management APIs")
@SecurityRequirement(name = "Bearer Authentication")
public class LikeController {

    private final LikeService likeService;

    @PostMapping("/posts/{postId}/like")
    public ResponseEntity<ApiResponse<Boolean>> toggleLikePost(@PathVariable String postId) {

        boolean isLiked = likeService.toggleLikePost(postId);

        return ResponseEntity.ok(
                ApiResponse.success(
                        isLiked ? "Liked" : "Unliked",
                        isLiked
                )
        );
    }

    @GetMapping("/posts/{postId}/likes")
    @Operation(summary = "Get post likes")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getPostLikes(@PathVariable String postId) {
        List<UserResponse> response = likeService.getPostLikes(postId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
