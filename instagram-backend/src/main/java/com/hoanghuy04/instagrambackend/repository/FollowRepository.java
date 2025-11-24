package com.hoanghuy04.instagrambackend.repository;

import com.hoanghuy04.instagrambackend.entity.Follow;
import com.hoanghuy04.instagrambackend.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
    Optional<Follow> findByFollowerAndFollowing(User follower, User following);

    Page<Follow> findByFollowing(User following, Pageable pageable);

    Page<Follow> findByFollower(User follower, Pageable pageable);

    List<Follow> findByFollowerId(String userId);

    List<Follow> findByFollowingId(String userId);

    boolean existsByFollowerIdAndFollowingId(String userId1, String userId2);
}

