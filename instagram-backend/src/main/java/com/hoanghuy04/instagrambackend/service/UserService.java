package com.hoanghuy04.instagrambackend.service;

import com.hoanghuy04.instagrambackend.dto.request.UpdateUserRequest;
import com.hoanghuy04.instagrambackend.dto.response.PageResponse;
import com.hoanghuy04.instagrambackend.dto.response.UserResponse;
import com.hoanghuy04.instagrambackend.dto.response.UserStatsResponse;
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

import java.util.List;
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
public class UserService {
    
    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final FollowRepository followRepository;
    
    /**
     * Get user by ID.
     *
     * @param userId the user ID
     * @return UserResponse
     */
    @Transactional(readOnly = true)
    public UserResponse getUserById(String userId) {
        log.debug("Getting user by ID: {}", userId);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        
        return convertToUserResponse(user);
    }
    
    /**
     * Get all users with pagination.
     *
     * @param pageable pagination information
     * @return PageResponse of UserResponse
     */
    @Transactional(readOnly = true)
    public PageResponse<UserResponse> getAllUsers(Pageable pageable) {
        log.debug("Getting all users");
        
        Page<UserResponse> page = userRepository.findAll(pageable)
                .map(this::convertToUserResponse);
        
        return PageResponse.of(page);
    }
    
    /**
     * Update user profile.
     *
     * @param userId the user ID
     * @param request the update request
     * @return updated UserResponse
     */
    @Transactional
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
        
        if (request.getIsPrivate() != null) {
            user.setIsPrivate(request.getIsPrivate());
        }
        
        user = userRepository.save(user);
        log.info("User updated successfully: {}", userId);
        
        return convertToUserResponse(user);
    }
    
    /**
     * Delete user account.
     *
     * @param userId the user ID
     */
    @Transactional
    public void deleteUser(String userId) {
        log.info("Deleting user: {}", userId);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        
        userRepository.delete(user);
        log.info("User deleted successfully: {}", userId);
    }
    
    /**
     * Get user followers.
     *
     * @param userId the user ID
     * @return List of UserResponse
     */
    @Transactional(readOnly = true)
    public List<UserResponse> getUserFollowers(String userId) {
        log.debug("Getting followers for user: {}", userId);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        
        return followRepository.findByFollowing(user).stream()
                .map(follow -> convertToUserResponse(follow.getFollower()))
                .collect(Collectors.toList());
    }
    
    /**
     * Get users that the user is following.
     *
     * @param userId the user ID
     * @return List of UserResponse
     */
    @Transactional(readOnly = true)
    public List<UserResponse> getUserFollowing(String userId) {
        log.debug("Getting following for user: {}", userId);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        
        return followRepository.findByFollower(user).stream()
                .map(follow -> convertToUserResponse(follow.getFollowing()))
                .collect(Collectors.toList());
    }
    
    /**
     * Search users by query.
     *
     * @param query the search query
     * @param pageable pagination information
     * @return PageResponse of UserResponse
     */
    @Transactional(readOnly = true)
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
    
    /**
     * Get user statistics.
     *
     * @param userId the user ID
     * @return UserStatsResponse
     */
    @Transactional(readOnly = true)
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
    
    /**
     * Get user entity by ID.
     *
     * @param userId the user ID
     * @return User entity
     */
    @Transactional(readOnly = true)
    public User getUserEntityById(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
    }
    
    /**
     * Convert User entity to UserResponse DTO.
     *
     * @param user the User entity
     * @return UserResponse DTO
     */
    public UserResponse convertToUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .profile(user.getProfile())
                .roles(user.getRoles())
                .followersCount(user.getFollowers() != null ? user.getFollowers().size() : 0)
                .followingCount(user.getFollowing() != null ? user.getFollowing().size() : 0)
                .isPrivate(user.getIsPrivate())
                .isVerified(user.getIsVerified())
                .isActive(user.getIsActive())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}

