package com.hoanghuy04.instagrambackend.repository;

import com.hoanghuy04.instagrambackend.entity.Follow;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface FollowRepository extends MongoRepository<Follow, String> {

    Optional<Follow> findByFollowerIdAndFollowingId(String followerId, String followingId);

    Page<Follow> findByFollowerId(String followerId, Pageable pageable);

    Page<Follow> findByFollowingId(String followingId, Pageable pageable);

    List<Follow> findByFollowerId(String followerId);

    List<Follow> findByFollowingId(String followingId);

    boolean existsByFollowerIdAndFollowingId(String followerId, String followingId);

    Page<Follow> findByFollowingIdAndFollowerUsernameContainingIgnoreCase(
            String followingId,
            String followerUsername,
            Pageable pageable
    );

    Page<Follow> findByFollowerIdAndFollowingUsernameContainingIgnoreCase(
            String followerId,
            String followingUsername,
            Pageable pageable
    );
}
