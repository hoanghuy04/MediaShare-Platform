package com.hoanghuy04.instagrambackend.repository;

import com.hoanghuy04.instagrambackend.entity.Like;

import com.hoanghuy04.instagrambackend.entity.User;
import com.hoanghuy04.instagrambackend.enums.LikeTargetType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;


public interface LikeRepository extends MongoRepository<Like, String> {

    Optional<Like> findByUserAndTargetTypeAndTargetId(
            User user,
            LikeTargetType targetType,
            String targetId
    );

    Page<Like> findByTargetTypeAndTargetId(
            LikeTargetType targetType,
            String targetId,
            Pageable pageable
    );

    List<Like> findByUserAndTargetTypeAndTargetIdIn(
            User user,
            LikeTargetType targetType,
            List<String> targetIds
    );

    void deleteByTargetTypeAndTargetId(LikeTargetType likeTargetType, String commentId);

    void deleteByTargetTypeAndTargetIdIn(LikeTargetType likeTargetType, List<String> commentIds);

    Page<Like> findByTargetTypeAndTargetIdAndUserIn(
            LikeTargetType targetType,
            String targetId,
            List<User> users,
            Pageable pageable
    );
}

