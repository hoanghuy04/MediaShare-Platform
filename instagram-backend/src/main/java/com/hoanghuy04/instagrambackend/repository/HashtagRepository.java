package com.hoanghuy04.instagrambackend.repository;

import com.hoanghuy04.instagrambackend.entity.Hashtag;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface HashtagRepository extends MongoRepository<Hashtag, String> {
    Optional<Hashtag> findByTag(String tag);
}
