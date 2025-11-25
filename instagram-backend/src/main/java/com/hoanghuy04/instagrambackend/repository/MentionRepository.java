package com.hoanghuy04.instagrambackend.repository;

import com.hoanghuy04.instagrambackend.entity.Mention;
import com.hoanghuy04.instagrambackend.enums.MentionTargetType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface MentionRepository extends MongoRepository<Mention, String> {

    void deleteByTargetTypeAndTargetId(MentionTargetType targetType, String targetId);

    List<Mention> findByTargetTypeAndTargetId(MentionTargetType targetType, String targetId);

    Page<Mention> findByMentionedUserId(String mentionedUserId, Pageable pageable);
}
