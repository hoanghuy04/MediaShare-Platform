package com.hoanghuy04.instagrambackend.repository;


import com.hoanghuy04.instagrambackend.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository interface for User entity operations.
 * Provides CRUD operations and custom queries for user management.
 *
 * @author Instagram Backend Team
 * @version 1.0.0
 */
@Repository
public interface UserRepository extends MongoRepository<User, String> {

    /**
     * Find a user by username.
     *
     * @param username the username to search for
     * @return Optional containing the user if found
     */
    Optional<User> findByUsername(String username);

    /**
     * Find a user by email.
     *
     * @param email the email to search for
     * @return Optional containing the user if found
     */
    Optional<User> findByEmail(String email);

    /**
     * Check if a user exists by username.
     *
     * @param username the username to check
     * @return true if user exists, false otherwise
     */
    boolean existsByUsername(String username);

    /**
     * Check if a user exists by email.
     *
     * @param email the email to check
     * @return true if user exists, false otherwise
     */
    boolean existsByEmail(String email);

    /**
     * Search users by username or name containing the query string.
     *
     * @param username the username search query
     * @param firstName the first name search query
     * @param lastName the last name search query
     * @param pageable pagination information
     * @return Page of users matching the search criteria
     */
    @Query("{'$or': [" +
            "{'username': {$regex: ?0, $options: 'i'}}, " +
            "{'profile.firstName': {$regex: ?1, $options: 'i'}}, " +
            "{'profile.lastName': {$regex: ?2, $options: 'i'}}" +
            "]}")
    Page<User> searchUsers(String username, String firstName, String lastName, Pageable pageable);

    List<User> findByUsernameContainingIgnoreCase(String username);
}