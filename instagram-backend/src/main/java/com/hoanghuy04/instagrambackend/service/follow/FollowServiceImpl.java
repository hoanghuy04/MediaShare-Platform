package com.hoanghuy04.instagrambackend.service.follow;

import com.hoanghuy04.instagrambackend.dto.response.FollowToggleResponse;
import com.hoanghuy04.instagrambackend.dto.response.FollowerUserResponse;
import com.hoanghuy04.instagrambackend.dto.response.PageResponse;
import com.hoanghuy04.instagrambackend.dto.response.PostLikeUserResponse;
import com.hoanghuy04.instagrambackend.entity.Follow;
import com.hoanghuy04.instagrambackend.entity.User;
import com.hoanghuy04.instagrambackend.exception.ResourceNotFoundException;
import com.hoanghuy04.instagrambackend.repository.FollowRepository;
import com.hoanghuy04.instagrambackend.repository.UserRepository;
import com.hoanghuy04.instagrambackend.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class FollowServiceImpl implements FollowService {

    private final FollowRepository followRepository;
    private final UserRepository userRepository;
    private final SecurityUtil securityUtil;

    @Transactional
    @Override
    public FollowToggleResponse toggleFollow(String targetUserId) {
        User currentUser = securityUtil.getCurrentUser();

        if (currentUser.getId().equals(targetUserId)) {
            throw new IllegalArgumentException("You cannot follow yourself");
        }

        User target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Optional<Follow> existing = followRepository.findByFollowerIdAndFollowingId(
                currentUser.getId(),
                target.getId()
        );

        boolean following;

        if (existing.isPresent()) {
            followRepository.delete(existing.get());

            long newFollowingCount = currentUser.getFollowingCount() - 1;
            long newFollowersCount = target.getFollowersCount() - 1;

            currentUser.setFollowingCount(Math.max(0L, newFollowingCount));
            target.setFollowersCount(Math.max(0L, newFollowersCount));

            following = false;
        } else {
            Follow follow = Follow.builder()
                    .followerId(currentUser.getId())
                    .followingId(target.getId())
                    .followerUsername(currentUser.getUsername())
                    .followingUsername(target.getUsername())
                    .build();

            followRepository.save(follow);

            currentUser.setFollowingCount(currentUser.getFollowingCount() + 1);
            target.setFollowersCount(target.getFollowersCount() + 1);

            following = true;
        }

        userRepository.save(currentUser);
        userRepository.save(target);

        return FollowToggleResponse.builder()
                .followerId(currentUser.getId())
                .followingId(target.getId())
                .followingByCurrentUser(following)
                .build();
    }

    @Transactional(readOnly = true)
    @Override
    public PageResponse<PostLikeUserResponse> getFollowers(String userId, Pageable pageable) {
        User target = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Page<Follow> page = followRepository.findByFollowingId(target.getId(), pageable);

        Page<PostLikeUserResponse> dtoPage = page.map(follow -> {
            String followerId = follow.getFollowerId();

            User follower = userRepository.findById(followerId)
                    .orElse(null);

            String avatarUrl = null;
            String username = follow.getFollowerUsername();

            if (follower != null) {
                if (follower.getProfile() != null) {
                    avatarUrl = follower.getProfile().getAvatar();
                }
                username = follower.getUsername();
            }

            PostLikeUserResponse dto = new PostLikeUserResponse();
            dto.setId(followerId);
            dto.setUsername(username);
            dto.setAvatarUrl(avatarUrl);

            return dto;
        });

        return PageResponse.of(dtoPage);
    }

    @Transactional(readOnly = true)
    @Override
    public PageResponse<PostLikeUserResponse> getFollowing(String userId, Pageable pageable) {
        User target = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Page<Follow> page = followRepository.findByFollowerId(target.getId(), pageable);

        Page<PostLikeUserResponse> dtoPage = page.map(follow -> {
            String followingId = follow.getFollowingId();

            User followingUser = userRepository.findById(followingId)
                    .orElse(null);

            String avatarUrl = null;
            String username = follow.getFollowingUsername();

            if (followingUser != null) {
                if (followingUser.getProfile() != null) {
                    avatarUrl = followingUser.getProfile().getAvatar();
                }
                username = followingUser.getUsername();
            }

            PostLikeUserResponse dto = new PostLikeUserResponse();
            dto.setId(followingId);
            dto.setUsername(username);
            dto.setAvatarUrl(avatarUrl);

            return dto;
        });

        return PageResponse.of(dtoPage);
    }

    @Transactional(readOnly = true)
    @Override
    public boolean isFollowing(String targetUserId) {
        User currentUser = securityUtil.getCurrentUser();

        if (currentUser.getId().equals(targetUserId)) {
            return false;
        }

        User target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Optional<Follow> existing = followRepository.findByFollowerIdAndFollowingId(
                currentUser.getId(),
                target.getId()
        );

        return existing.isPresent();
    }

    @Transactional(readOnly = true)
    @Override
    public PageResponse<FollowerUserResponse> searchFollowers(String userId, String username, Pageable pageable) {
        User currentUser = securityUtil.getCurrentUser();

        User target = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Page<Follow> page = followRepository.findByFollowingIdAndFollowerUsernameContainingIgnoreCase(
                target.getId(),
                username,
                pageable
        );

        Page<FollowerUserResponse> dtoPage = page.map(follow -> {
            String followerId = follow.getFollowerId();

            User follower = userRepository.findById(followerId)
                    .orElse(null);

            String avatarUrl = null;
            String followerUsername = follow.getFollowerUsername();

            if (follower != null) {
                if (follower.getProfile() != null) {
                    avatarUrl = follower.getProfile().getAvatar();
                }
                followerUsername = follower.getUsername();
            }

            boolean isFollowedByCurrentUser = followRepository.existsByFollowerIdAndFollowingId(
                    currentUser.getId(),
                    followerId
            );

            return FollowerUserResponse.builder()
                    .id(followerId)
                    .username(followerUsername)
                    .avatarUrl(avatarUrl)
                    .followingByCurrentUser(isFollowedByCurrentUser)
                    .build();
        });

        return PageResponse.of(dtoPage);
    }

    @Transactional(readOnly = true)
    @Override
    public PageResponse<PostLikeUserResponse> searchFollowing(String userId, String username, Pageable pageable) {
        User target = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Page<Follow> page = followRepository.findByFollowerIdAndFollowingUsernameContainingIgnoreCase(
                target.getId(),
                username,
                pageable
        );

        Page<PostLikeUserResponse> dtoPage = page.map(follow -> {
            String followingId = follow.getFollowingId();

            User followingUser = userRepository.findById(followingId)
                    .orElse(null);

            String avatarUrl = null;
            String followingUsername = follow.getFollowingUsername();

            if (followingUser != null) {
                if (followingUser.getProfile() != null) {
                    avatarUrl = followingUser.getProfile().getAvatar();
                }
                followingUsername = followingUser.getUsername();
            }

            return PostLikeUserResponse.builder()
                    .id(followingId)
                    .username(followingUsername)
                    .avatarUrl(avatarUrl)
                    .build();
        });

        return PageResponse.of(dtoPage);
    }

    @Transactional
    @Override
    public void removeFollower(String followerId) {
        User currentUser = securityUtil.getCurrentUser();

        User follower = userRepository.findById(followerId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Optional<Follow> existing = followRepository.findByFollowerIdAndFollowingId(
                followerId,
                currentUser.getId()
        );

        if (existing.isPresent()) {
            followRepository.delete(existing.get());

            long newFollowersCount = currentUser.getFollowersCount() - 1;
            currentUser.setFollowersCount(Math.max(0L, newFollowersCount));
            userRepository.save(currentUser);

            long newFollowingCount = follower.getFollowingCount() - 1;
            follower.setFollowingCount(Math.max(0L, newFollowingCount));
            userRepository.save(follower);
        }
    }
}
