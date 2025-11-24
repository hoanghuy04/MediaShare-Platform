package com.hoanghuy04.instagrambackend.service.follow;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service interface for follow operations.
 * Handles user follow/unfollow relationships.
 * 
 * @author Instagram Backend Team
 * @version 1.0.0
 */

import com.hoanghuy04.instagrambackend.dto.response.FollowToggleResponse;
import com.hoanghuy04.instagrambackend.dto.response.PageResponse;
import com.hoanghuy04.instagrambackend.dto.response.PostLikeUserResponse;
import org.springframework.data.domain.Pageable;

public interface FollowService {

    FollowToggleResponse toggleFollow(String targetUserId);

    PageResponse<PostLikeUserResponse> getFollowers(String userId, Pageable pageable);

    PageResponse<PostLikeUserResponse> getFollowing(String userId, Pageable pageable);

    boolean isFollowing(String targetUserId);
}

