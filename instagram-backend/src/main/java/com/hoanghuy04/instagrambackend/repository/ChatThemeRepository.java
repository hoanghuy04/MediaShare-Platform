package com.hoanghuy04.instagrambackend.repository;

import com.hoanghuy04.instagrambackend.entity.ChatTheme;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ChatThemeRepository extends MongoRepository<ChatTheme, String> {
}
