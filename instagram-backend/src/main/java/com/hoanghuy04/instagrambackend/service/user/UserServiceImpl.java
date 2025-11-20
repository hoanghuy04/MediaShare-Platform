package com.hoanghuy04.instagrambackend.service.user;

import com.hoanghuy04.instagrambackend.dto.request.UpdateUserRequest;
import com.hoanghuy04.instagrambackend.dto.response.PageResponse;
import com.hoanghuy04.instagrambackend.dto.response.UserResponse;
import com.hoanghuy04.instagrambackend.dto.response.UserStatsResponse;
import com.hoanghuy04.instagrambackend.dto.response.UserSummaryDTO;
import com.hoanghuy04.instagrambackend.entity.Follow;
import com.hoanghuy04.instagrambackend.entity.User;
import com.hoanghuy04.instagrambackend.entity.UserProfile;
import com.hoanghuy04.instagrambackend.exception.ResourceNotFoundException;
import com.hoanghuy04.instagrambackend.repository.FollowRepository;
import com.hoanghuy04.instagrambackend.repository.PostRepository;
import com.hoanghuy04.instagrambackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Service class for user operations.
 * Handles user profile management and queries.
 *
 * @author Instagram Backend Team
 * @version 1.0.0
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final FollowRepository followRepository;

    @Transactional(readOnly = true)
    @Override
    public UserResponse getUserById(String userId) {
        log.debug("Getting user by ID: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        return convertToUserResponse(user);
    }

    @Transactional(readOnly = true)
    @Override
    public PageResponse<UserResponse> getAllUsers(Pageable pageable) {
        log.debug("Getting all users");

        Page<UserResponse> page = userRepository.findAll(pageable)
                .map(this::convertToUserResponse);

        return PageResponse.of(page);
    }

    @Transactional
    @Override
    public UserResponse updateUser(String userId, UpdateUserRequest request) {
        log.info("Updating user: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        // Update profile
        UserProfile profile = user.getProfile();
        if (profile == null) {
            profile = new UserProfile();
        }

        if (request.getFirstName() != null) {
            profile.setFirstName(request.getFirstName());
        }
        if (request.getLastName() != null) {
            profile.setLastName(request.getLastName());
        }
        if (request.getBio() != null) {
            profile.setBio(request.getBio());
        }
        if (request.getWebsite() != null) {
            profile.setWebsite(request.getWebsite());
        }
        if (request.getLocation() != null) {
            profile.setLocation(request.getLocation());
        }

        user.setProfile(profile);

        user.setPrivate(request.isPrivate());

        user = userRepository.save(user);
        log.info("User updated successfully: {}", userId);

        return convertToUserResponse(user);
    }

    @Transactional
    @Override
    public void deleteUser(String userId) {
        log.info("Deleting user: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        userRepository.delete(user);
        log.info("User deleted successfully: {}", userId);
    }

    @Transactional(readOnly = true)
    @Override
    public List<UserResponse> getUserFollowers(String userId) {
        log.debug("Getting followers for user: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        return followRepository.findByFollowing(user).stream()
                .map(follow -> convertToUserResponse(follow.getFollower()))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    @Override
    public List<UserResponse> getUserFollowing(String userId) {
        log.debug("Getting following for user: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        return followRepository.findByFollower(user).stream()
                .map(follow -> convertToUserResponse(follow.getFollowing()))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    @Override
    public PageResponse<UserResponse> searchUsers(String query, Pageable pageable) {
        log.debug("Searching users with query: '{}', page: {}, size: {}", query, pageable.getPageNumber(), pageable.getPageSize());

        Page<UserResponse> page = userRepository.searchUsers(query, query, query, pageable)
                .map(this::convertToUserResponse);

        log.debug("Found {} users on page {} of {} (total {} users)",
                page.getNumberOfElements(),
                page.getNumber(),
                Math.max(page.getTotalPages() - 1, 0),
                page.getTotalElements());

        return PageResponse.of(page);
    }

    @Transactional(readOnly = true)
    @Override
    public UserStatsResponse getUserStats(String userId) {
        log.debug("Getting stats for user: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        long postsCount = postRepository.countByAuthor(user);
        long followersCount = followRepository.countByFollowing(user);
        long followingCount = followRepository.countByFollower(user);

        return UserStatsResponse.builder()
                .userId(userId)
                .postsCount(postsCount)
                .followersCount(followersCount)
                .followingCount(followingCount)
                .build();
    }

    @Transactional(readOnly = true)
    @Override
    public User getUserEntityById(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
    }

    @Override
    public UserResponse convertToUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .profile(user.getProfile())
                .roles(user.getRoles())
                .followersCount(user.getFollowers() != null ? user.getFollowers().size() : 0)
                .followingCount(user.getFollowing() != null ? user.getFollowing().size() : 0)
                .isPrivate(user.isPrivate())
                .isVerified(user.isVerified())
                .isActive(user.isActive())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
    
    @Transactional(readOnly = true)
    @Override
    public List<UserSummaryDTO> getMutualFollows(String userId, String query, int page, int size) {
        log.debug("Getting mutual follows for user {} with query: {}", userId, query);

        userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        // Lấy danh sách following và followers
        List<Follow> following = followRepository.findByFollowerId(userId);
        List<Follow> followers = followRepository.findByFollowingId(userId);
        
        // Tạo Set để giao cắt
        Set<String> followingIds = following.stream()
                .map(f -> f.getFollowing().getId())
                .collect(Collectors.toSet());
        
        Set<String> followerIds = followers.stream()
                .map(f -> f.getFollower().getId())
                .collect(Collectors.toSet());
        
        // Giao cắt: mutual = vừa là following vừa là follower
        Set<String> mutualIds = followingIds.stream()
                .filter(followerIds::contains)
                .collect(Collectors.toSet());
        
        if (mutualIds.isEmpty()) {
            log.debug("No mutual follows found for user {}", userId);
            return new ArrayList<>();
        }
        
        // Load users
        List<User> mutualUsers = new ArrayList<>();
        userRepository.findAllById(mutualIds).forEach(mutualUsers::add);
        
        // Filter theo query nếu có
        if (query != null && !query.trim().isEmpty()) {
            String lowerQuery = query.toLowerCase();
            mutualUsers = mutualUsers.stream()
                    .filter(u -> {
                        String username = u.getUsername() != null ? u.getUsername().toLowerCase() : "";
                        String firstName = u.getProfile() != null && u.getProfile().getFirstName() != null
                                ? u.getProfile().getFirstName().toLowerCase() : "";
                        String lastName = u.getProfile() != null && u.getProfile().getLastName() != null
                                ? u.getProfile().getLastName().toLowerCase() : "";
                        return username.contains(lowerQuery) ||
                               firstName.contains(lowerQuery) ||
                               lastName.contains(lowerQuery);
                    })
                    .collect(Collectors.toList());
        }
        
        // Pagination (manual)
        int start = page * size;
        int end = Math.min(start + size, mutualUsers.size());
        List<User> paginatedUsers = start < mutualUsers.size()
                ? mutualUsers.subList(start, end)
                : new ArrayList<>();
        
        // Map to DTOs
        return paginatedUsers.stream()
                .map(this::toUserSummary)
                .collect(Collectors.toList());
    }

    private UserSummaryDTO toUserSummary(User user) {
        return UserSummaryDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .avatar(user.getProfile() != null ? user.getProfile().getAvatar() : null)
                .isVerified(user.isVerified())
                .build();
    }
}

