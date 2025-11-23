package com.hoanghuy04.instagrambackend.service.post;

import com.hoanghuy04.instagrambackend.dto.response.PageResponse;
import com.hoanghuy04.instagrambackend.dto.response.PostLikeToggleResponse;
import com.hoanghuy04.instagrambackend.dto.response.PostLikeUserResponse;
import org.springframework.data.domain.Pageable;


public interface PostLikeService {
    PostLikeToggleResponse toggleLikePost(String postId);

    PageResponse<PostLikeUserResponse> getPostLikes(String postId, String query, Pageable pageable);
}
