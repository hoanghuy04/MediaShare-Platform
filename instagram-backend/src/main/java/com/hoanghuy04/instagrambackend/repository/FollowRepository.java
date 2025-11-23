package com.hoanghuy04.instagrambackend.repository;

import com.hoanghuy04.instagrambackend.entity.Follow;
import com.hoanghuy04.instagrambackend.entity.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository interface for Follow entity operations.
 * Provides CRUD operations and custom queries for follow relationship management.
 *
 * @author Instagram Backend Team
 * @version 1.0.0
 */
@Repository
public interface FollowRepository extends MongoRepository<Follow, String> {

    /**
     * Find a follow relationship between two users.
     *
     * @param follower the user who is following
     * @param following the user being followed
     * @return Optional containing the follow relationship if found
     */
    Optional<Follow> findByFollowerAndFollowing(User follower, User following);

    /**
     * Find a follow relationship by follower ID and following ID.
     *
     * @param followerId the ID of the follower
     * @param followingId the ID of the user being followed
     * @return Optional containing the follow relationship if found
     */
    Optional<Follow> findByFollowerIdAndFollowingId(String followerId, String followingId);

    /**
     * Find all followers of a user.
     *
     * @param following the user whose followers to find
     * @return List of follow relationships representing followers
     */
    List<Follow> findByFollowing(User following);

    /**
     * Find all users that a user is following.
     *
     * @param follower the user whose following list to find
     * @return List of follow relationships representing following
     */
    List<Follow> findByFollower(User follower);

    /**
     * Check if a user is following another user.
     *
     * @param follower the user who might be following
     * @param following the user who might be followed
     * @return true if the follow relationship exists, false otherwise
     */
    boolean existsByFollowerAndFollowing(User follower, User following);

    /**
     * Count followers of a user.
     *
     * @param following the user whose followers to count
     * @return number of followers
     */
    long countByFollowing(User following);

    /**
     * Count users that a user is following.
     *
     * @param follower the user whose following count to get
     * @return number of users being followed
     */
    long countByFollower(User follower);

    /**
     * Delete a follow relationship.
     *
     * @param follower the user who is following
     * @param following the user being followed
     */
    void deleteByFollowerAndFollowing(User follower, User following);

    /**
     * Check if a follow relationship exists by follower ID and following ID.
     *
     * @param followerId the follower user ID
     * @param followingId the following user ID
     * @return true if the follow relationship exists, false otherwise
     */
    boolean existsByFollowerIdAndFollowingId(String followerId, String followingId);

    /**
     * Find all follow relationships where the given user is the follower.
     *
     * @param followerId the ID of the follower user
     * @return List of follow relationships
     */
    List<Follow> findByFollowerId(String followerId);

    /**
     * Find all follow relationships where the given user is being followed.
     *
     * @param followingId the ID of the user being followed
     * @return List of follow relationships
     */
    List<Follow> findByFollowingId(String followingId);
}