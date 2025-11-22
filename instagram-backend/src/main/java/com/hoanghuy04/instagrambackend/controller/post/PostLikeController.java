package com.hoanghuy04.instagrambackend.controller.post;

/*
 * @description: PostLikeController
 * @author: Trần Ngọc Huyền
 * @date: 11/21/2025
 * @version: 1.0
 */

import com.hoanghuy04.instagrambackend.dto.response.ApiResponse;
import com.hoanghuy04.instagrambackend.dto.response.PageResponse;
import com.hoanghuy04.instagrambackend.dto.response.PostLikeToggleResponse;
import com.hoanghuy04.instagrambackend.dto.response.PostLikeUserResponse;
import com.hoanghuy04.instagrambackend.service.post.PostLikeService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/posts")
@RequiredArgsConstructor
@Tag(name = "Posts", description = "Post management APIs")
@SecurityRequirement(name = "Bearer Authentication")
public class PostLikeController {

    private final PostLikeService postLikeService;

    @PostMapping("/{postId}/like")
    public ResponseEntity<ApiResponse<PostLikeToggleResponse>> toggleLikePost(
            @PathVariable String postId
    ) {
        return ResponseEntity.ok(ApiResponse.success(postLikeService.toggleLikePost(postId)));
    }

    @GetMapping("/{postId}/likes")
    public ResponseEntity<ApiResponse<PageResponse<PostLikeUserResponse>>> getPostLikes(
            @PathVariable String postId,
            @PageableDefault(
                    sort = "createdAt",
                    direction = Sort.Direction.DESC
            ) Pageable pageable
    ) {

        return ResponseEntity.ok(ApiResponse.success(postLikeService.getPostLikes(postId, pageable)));
    }
}

