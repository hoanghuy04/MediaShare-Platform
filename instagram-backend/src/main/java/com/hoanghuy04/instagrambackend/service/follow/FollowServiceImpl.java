package com.hoanghuy04.instagrambackend.service.follow;

import com.hoanghuy04.instagrambackend.dto.response.FollowToggleResponse;
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

        Optional<Follow> existing = followRepository.findByFollowerAndFollowing(currentUser, target);

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
                    .follower(currentUser)
                    .following(target)
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

        Page<Follow> page = followRepository.findByFollowing(target, pageable);

        Page<PostLikeUserResponse> dtoPage = page.map(follow -> {
            User follower = follow.getFollower();

            String avatarUrl = null;
            if (follower.getProfile() != null) {
                avatarUrl = follower.getProfile().getAvatar();
            }

            PostLikeUserResponse dto = new PostLikeUserResponse();
            dto.setId(follower.getId());
            dto.setUsername(follower.getUsername());
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

        Page<Follow> page = followRepository.findByFollower(target, pageable);

        Page<PostLikeUserResponse> dtoPage = page.map(follow -> {
            User followingUser = follow.getFollowing();

            String avatarUrl = null;
            if (followingUser.getProfile() != null) {
                avatarUrl = followingUser.getProfile().getAvatar();
            }

            PostLikeUserResponse dto = new PostLikeUserResponse();
            dto.setId(followingUser.getId());
            dto.setUsername(followingUser.getUsername());
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

        Optional<Follow> existing = followRepository.findByFollowerAndFollowing(currentUser, target);

        return existing.isPresent();
    }
}
