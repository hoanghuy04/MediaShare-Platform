package com.hoanghuy04.instagrambackend.service;

import com.hoanghuy04.instagrambackend.entity.Follow;
import com.hoanghuy04.instagrambackend.entity.User;
import com.hoanghuy04.instagrambackend.exception.BadRequestException;
import com.hoanghuy04.instagrambackend.repository.FollowRepository;
import com.hoanghuy04.instagrambackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service class for follow operations.
 * Handles user follow/unfollow relationships.
 * 
 * @author Instagram Backend Team
 * @version 1.0.0
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FollowService {
    
    private final FollowRepository followRepository;
    private final UserService userService;
    private final UserRepository userRepository;

    /**
     * Follow a user.
     *
     * @param followerId the follower user ID
     * @param followingId the user ID to follow
     */
    @Transactional
    public void followUser(String followerId, String followingId) {
        log.info("User {} following user: {}", followerId, followingId);
        
        if (followerId.equals(followingId)) {
            throw new BadRequestException("You cannot follow yourself");
        }
        
        User follower = userService.getUserEntityById(followerId);
        User following = userService.getUserEntityById(followingId);
        
        // Check if already following
        if (followRepository.existsByFollowerAndFollowing(follower, following)) {
            throw new BadRequestException("You are already following this user");
        }
        
        Follow follow = Follow.builder()
                .follower(follower)
                .following(following)
                .build();
        
        followRepository.save(follow);
        
        // Update user's following and followers lists
        follower.getFollowing().add(followingId);
        following.getFollowers().add(followerId);


        userRepository.save(follower);
        userRepository.save(following);

        log.info("User followed successfully");
    }
    
    /**
     * Unfollow a user.
     *
     * @param followerId the follower user ID
     * @param followingId the user ID to unfollow
     */
    @Transactional
    public void unfollowUser(String followerId, String followingId) {
        log.info("User {} unfollowing user: {}", followerId, followingId);
        
        User follower = userService.getUserEntityById(followerId);
        User following = userService.getUserEntityById(followingId);
        
        Follow follow = followRepository.findByFollowerAndFollowing(follower, following)
                .orElseThrow(() -> new BadRequestException("You are not following this user"));
        
        followRepository.delete(follow);
        
        // Update user's following and followers lists
        follower.getFollowing().remove(followingId);
        following.getFollowers().remove(followerId);
        
        log.info("User unfollowed successfully");
    }
    
    /**
     * Check if a user is following another user.
     *
     * @param followerId the follower user ID
     * @param followingId the user ID to check
     * @return true if following, false otherwise
     */
    @Transactional(readOnly = true)
    public boolean isFollowing(String followerId, String followingId) {
        log.debug("Checking if user {} is following user: {}", followerId, followingId);
        
        User follower = userService.getUserEntityById(followerId);
        User following = userService.getUserEntityById(followingId);
        
        return followRepository.existsByFollowerAndFollowing(follower, following);
    }
    
    /**
     * Get follower count for a user.
     *
     * @param userId the user ID
     * @return follower count
     */
    @Transactional(readOnly = true)
    public long getFollowerCount(String userId) {
        log.debug("Getting follower count for user: {}", userId);
        
        User user = userService.getUserEntityById(userId);
        return followRepository.countByFollowing(user);
    }
    
    /**
     * Get following count for a user.
     *
     * @param userId the user ID
     * @return following count
     */
    @Transactional(readOnly = true)
    public long getFollowingCount(String userId) {
        log.debug("Getting following count for user: {}", userId);
        
        User user = userService.getUserEntityById(userId);
        return followRepository.countByFollower(user);
    }
}

