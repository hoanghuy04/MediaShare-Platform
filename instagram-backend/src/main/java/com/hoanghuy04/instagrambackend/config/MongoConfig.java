package com.hoanghuy04.instagrambackend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.config.EnableMongoAuditing;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;

/**
 * MongoDB configuration class.
 * Enables MongoDB auditing and repository support.
 * 
 * @author Instagram Backend Team
 * @version 1.0.0
 */
@Configuration
@EnableMongoAuditing
@EnableMongoRepositories(basePackages = "com.hoanghuy04.instagrambackend.repository")
public class MongoConfig {
}

