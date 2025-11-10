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
@Service
public interface FollowService {
    
    /**
     * Follow a user.
     *
     * @param followerId the follower user ID
     * @param followingId the user ID to follow
     */
    @Transactional
    void followUser(String followerId, String followingId);

    /**
     * Unfollow a user.
     *
     * @param followerId the follower user ID
     * @param followingId the user ID to unfollow
     */
    @Transactional
    void unfollowUser(String followerId, String followingId);

    /**
     * Check if a user is following another user.
     *
     * @param followerId the follower user ID
     * @param followingId the user ID to check
     * @return true if following, false otherwise
     */
    @Transactional(readOnly = true)
    boolean isFollowing(String followerId, String followingId);

    /**
     * Get follower count for a user.
     *
     * @param userId the user ID
     * @return follower count
     */
    @Transactional(readOnly = true)
    long getFollowerCount(String userId);

    /**
     * Get following count for a user.
     *
     * @param userId the user ID
     * @return following count
     */
    @Transactional(readOnly = true)
    long getFollowingCount(String userId);
}
