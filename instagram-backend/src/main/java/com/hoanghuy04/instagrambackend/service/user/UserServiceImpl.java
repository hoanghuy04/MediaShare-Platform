package com.hoanghuy04.instagrambackend.service.user;

import com.hoanghuy04.instagrambackend.dto.request.UpdateUserRequest;
import com.hoanghuy04.instagrambackend.dto.response.PageResponse;
import com.hoanghuy04.instagrambackend.dto.response.UserResponse;
import com.hoanghuy04.instagrambackend.dto.response.UserStatsResponse;
import com.hoanghuy04.instagrambackend.dto.response.UserSummaryResponse;
import com.hoanghuy04.instagrambackend.entity.Follow;
import com.hoanghuy04.instagrambackend.entity.User;
import com.hoanghuy04.instagrambackend.entity.UserProfile;
import com.hoanghuy04.instagrambackend.exception.ResourceNotFoundException;
import com.hoanghuy04.instagrambackend.mapper.UserMapper;
import com.hoanghuy04.instagrambackend.repository.FollowRepository;
import com.hoanghuy04.instagrambackend.repository.PostRepository;
import com.hoanghuy04.instagrambackend.repository.UserRepository;
import com.hoanghuy04.instagrambackend.service.FileService;
import com.hoanghuy04.instagrambackend.util.SecurityUtil;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
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
@Builder
@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class UserServiceImpl implements UserService {

    UserRepository userRepository;
    PostRepository postRepository;
    FollowRepository followRepository;
    FileService fileService;
    UserMapper userMapper;
    SecurityUtil securityUtil;

    @Override
    public User ensureAiUser() {
        UserProfile userProfile = UserProfile.builder()
                .firstName("AI")
                .lastName("Assistant")
                .avatar("000000000000000000000000")
                .build();

        return userRepository.findByUsername("ai-assistant")
                .or(() -> userRepository.findByEmail("ai@system.local"))
                .orElseGet(() -> {
                    try {
                        User ai = new User();
                        ai.setUsername("ai-assistant");
                        ai.setEmail("ai@system.local");
                        ai.setProfile(userProfile);
                        ai.setActive(true);
                        ai.setVerified(true);
                        return userRepository.save(ai);
                    } catch (org.springframework.dao.DuplicateKeyException e) {
                        // Race condition: another thread created it, try to find again
                        return userRepository.findByUsername("ai-assistant")
                                .or(() -> userRepository.findByEmail("ai@system.local"))
                                .orElseThrow(() -> new RuntimeException("Failed to create or find AI user"));
                    }
                });
    }

    @Transactional(readOnly = true)
    @Override
    public UserResponse getUserById(String userId) {
        log.debug("Getting user by ID: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        UserResponse dto = userMapper.toUserResponse(user);

        User current = securityUtil.getCurrentUser();
        boolean following = false;

        if (current != null && !current.getId().equals(user.getId())) {
            // ĐÃ ĐỔI: dùng existsByFollowerIdAndFollowingId thay vì findByFollowerAndFollowing
            following = followRepository
                    .existsByFollowerIdAndFollowingId(current.getId(), user.getId());
        }

        dto.setFollowingByCurrentUser(following);
        return dto;
    }

    @Transactional(readOnly = true)
    @Override
    public PageResponse<UserResponse> getAllUsers(Pageable pageable) {
        log.debug("Getting all users");

        Page<UserResponse> page = userRepository.findAll(pageable)
                .map(userMapper::toUserResponse);

        return PageResponse.of(page);
    }

    @Transactional
    @Override
    public UserResponse updateUser(String userId, UpdateUserRequest request) {
        log.info("Updating user: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

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
        if (request.getAvatar() != null) {
            profile.setAvatar(request.getAvatar());
        }

        user.setUsernameSearch(normalizeUsername(user.getUsername()));

        user.setProfile(profile);

        user.setPrivate(request.isPrivate());

        user = userRepository.save(user);
        log.info("User updated successfully: {}", userId);

        return userMapper.toUserResponse(user);
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
    public PageResponse<UserResponse> searchUsers(String query, Pageable pageable) {
        log.debug("Searching users with query: '{}', page: {}, size: {}", query, pageable.getPageNumber(), pageable.getPageSize());

        Page<UserResponse> page = userRepository.searchUsers(query, query, query, pageable)
                .map(userMapper::toUserResponse);

        log.debug("Found {} users on page {} of {} (total {} users)",
                page.getNumberOfElements(),
                page.getNumber(),
                Math.max(page.getTotalPages() - 1, 0),
                page.getTotalElements());

        return PageResponse.of(page);
    }

    @Transactional(readOnly = true)
    @Override
    public User getUserEntityById(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
    }

    @Override
    public UserResponse convertToUserResponse(User user) {
        return userMapper.toUserResponse(user);
    }

    @Transactional(readOnly = true)
    @Override
    public List<UserResponse> getMutualFollows(String userId, String query, int page, int size) {
        log.debug("Getting mutual follows for user {} with query: {}", userId, query);

        userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        // Lấy danh sách following và followers (theo schema Follow mới: followerId / followingId)
        List<Follow> following = followRepository.findByFollowerId(userId);
        List<Follow> followers = followRepository.findByFollowingId(userId);

        // Tạo Set để giao cắt
        Set<String> followingIds = following.stream()
                .map(Follow::getFollowingId)
                .collect(Collectors.toSet());

        Set<String> followerIds = followers.stream()
                .map(Follow::getFollowerId)
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
                .map(userMapper::toUserResponse)
                .collect(Collectors.toList());
    }

    public String normalizeUsername(String username) {
        if (username == null) return null;
        String lower = username.toLowerCase();
        return java.text.Normalizer.normalize(lower, java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
    }

}
