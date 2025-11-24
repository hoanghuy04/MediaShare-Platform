package com.hoanghuy04.instagrambackend.service.user;

import com.hoanghuy04.instagrambackend.dto.request.UpdateUserRequest;
import com.hoanghuy04.instagrambackend.dto.response.PageResponse;
import com.hoanghuy04.instagrambackend.dto.response.UserResponse;
import com.hoanghuy04.instagrambackend.dto.response.UserStatsResponse;
import com.hoanghuy04.instagrambackend.dto.response.UserSummaryResponse;
import com.hoanghuy04.instagrambackend.entity.User;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service interface for user operations.
 * Handles user profile management and queries.
 *
 * @author Instagram Backend Team
 * @version 1.0.0
 */
@Service
public interface UserService {

    User ensureAiUser();
    
    /**
     * Get user by ID.
     *
     * @param userId the user ID
     * @return UserResponse
     */
    @Transactional(readOnly = true)
    UserResponse getUserById(String userId);

    /**
     * Get all users with pagination.
     *
     * @param pageable pagination information
     * @return PageResponse of UserResponse
     */
    @Transactional(readOnly = true)
    PageResponse<UserResponse> getAllUsers(Pageable pageable);

    /**
     * Update user profile.
     *
     * @param userId  the user ID
     * @param request the update request
     * @return updated UserResponse
     */
    @Transactional
    UserResponse updateUser(String userId, UpdateUserRequest request);

    /**
     * Delete user account.
     *
     * @param userId the user ID
     */
    @Transactional
    void deleteUser(String userId);

    /**
     * Search users by query.
     *
     * @param query    the search query
     * @param pageable pagination information
     * @return PageResponse of UserResponse
     */
    @Transactional(readOnly = true)
    PageResponse<UserResponse> searchUsers(String query, Pageable pageable);

    /**
     * Get user entity by ID.
     *
     * @param userId the user ID
     * @return User entity
     */
    @Transactional(readOnly = true)
    User getUserEntityById(String userId);

    /**
     * Convert User entity to UserResponse DTO.
     *
     * @param user the User entity
     * @return UserResponse DTO
     */
    UserResponse convertToUserResponse(User user);

    /**
     * Get mutual follows for a user (users that both follow each other).
     *
     * @param userId the user ID
     * @param query the search query (optional, filters by username, firstName, lastName)
     * @param page the page number (0-indexed)
     * @param size the page size
     * @return List of UserSummaryDTO representing mutual follows
     */
    @Transactional(readOnly = true)
    List<UserResponse> getMutualFollows(String userId, String query, int page, int size);
}
