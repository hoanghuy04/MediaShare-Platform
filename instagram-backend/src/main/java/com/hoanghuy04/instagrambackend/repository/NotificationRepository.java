package com.hoanghuy04.instagrambackend.repository;

import com.hoanghuy04.instagrambackend.entity.Notification;
import com.hoanghuy04.instagrambackend.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository interface for Notification entity operations.
 * Provides CRUD operations and custom queries for notification management.
 * 
 * @author Instagram Backend Team
 * @version 1.0.0
 */
@Repository
public interface NotificationRepository extends MongoRepository<Notification, String> {
    
    /**
     * Find all notifications for a user.
     *
     * @param user the user to find notifications for
     * @param pageable pagination information
     * @return Page of notifications for the user
     */
    Page<Notification> findByUser(User user, Pageable pageable);
    
    /**
     * Find all notifications for a user by user ID.
     *
     * @param userId the ID of the user
     * @param pageable pagination information
     * @return Page of notifications for the user
     */
    Page<Notification> findByUserId(String userId, Pageable pageable);
    
    /**
     * Find unread notifications for a user.
     *
     * @param user the user to find unread notifications for
     * @param isRead read status
     * @param pageable pagination information
     * @return Page of unread notifications
     */
    Page<Notification> findByUserAndIsRead(User user, boolean isRead, Pageable pageable);
    
    /**
     * Count unread notifications for a user.
     *
     * @param user the user to count unread notifications for
     * @return number of unread notifications
     */
    long countByUserAndIsReadFalse(User user);
    
    /**
     * Delete all notifications for a user.
     *
     * @param user the user whose notifications should be deleted
     */
    void deleteByUser(User user);
}

