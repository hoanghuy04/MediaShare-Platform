package com.hoanghuy04.instagrambackend.service.notification;

import com.hoanghuy04.instagrambackend.dto.response.NotificationResponse;
import com.hoanghuy04.instagrambackend.dto.response.PageResponse;
import com.hoanghuy04.instagrambackend.entity.Notification;
import com.hoanghuy04.instagrambackend.entity.User;
import com.hoanghuy04.instagrambackend.exception.ResourceNotFoundException;
import com.hoanghuy04.instagrambackend.repository.NotificationRepository;
import com.hoanghuy04.instagrambackend.service.user.UserService;
import com.hoanghuy04.instagrambackend.service.user.UserServiceImpl;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service class for notification operations.
 * Handles notification creation and management.
 * 
 * @author Instagram Backend Team
 * @version 1.0.0
 */
@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class NotificationServiceImpl implements NotificationService {
    
    private final NotificationRepository notificationRepository;
    private final UserService userService;
    
    /**
     * Create a new notification.
     *
     * @param notification the notification to create
     */
    @Transactional
    @Override
    public void createNotification(Notification notification) {
        log.info("Creating notification for user: {}", notification.getUser().getId());
        
        notificationRepository.save(notification);
        
        log.info("Notification created successfully");
    }
    
    /**
     * Get notifications for a user.
     *
     * @param userId the user ID
     * @param pageable pagination information
     * @return PageResponse of NotificationResponse
     */
    @Transactional(readOnly = true)
    @Override
    public PageResponse<NotificationResponse> getNotifications(String userId, Pageable pageable) {
        log.debug("Getting notifications for user: {}", userId);
        
        Page<NotificationResponse> page = notificationRepository.findByUserId(userId, pageable)
                .map(this::convertToNotificationResponse);
        
        return PageResponse.of(page);
    }
    
    /**
     * Mark a notification as read.
     *
     * @param notificationId the notification ID
     */
    @Transactional
    @Override
    public void markAsRead(String notificationId) {
        log.info("Marking notification as read: {}", notificationId);
        
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + notificationId));
        
        notification.setRead(true);
        notificationRepository.save(notification);
        
        log.info("Notification marked as read successfully");
    }
    
    /**
     * Delete a notification.
     *
     * @param notificationId the notification ID
     */
    @Transactional
    @Override
    public void deleteNotification(String notificationId) {
        log.info("Deleting notification: {}", notificationId);
        
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + notificationId));
        
        notificationRepository.delete(notification);
        log.info("Notification deleted successfully");
    }
    
    /**
     * Get unread notification count for a user.
     *
     * @param userId the user ID
     * @return unread count
     */
    @Transactional(readOnly = true)
    @Override
    public long getUnreadCount(String userId) {
        log.debug("Getting unread notification count for user: {}", userId);
        
        User user = userService.getUserEntityById(userId);
        return notificationRepository.countByUserAndIsReadFalse(user);
    }
    
    /**
     * Convert Notification entity to NotificationResponse DTO.
     *
     * @param notification the Notification entity
     * @return NotificationResponse DTO
     */
    private NotificationResponse convertToNotificationResponse(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .type(notification.getType())
                .relatedUser(notification.getRelatedUser() != null 
                        ? userService.convertToUserResponse(notification.getRelatedUser()) 
                        : null)
                .relatedPostId(notification.getRelatedPost() != null 
                        ? notification.getRelatedPost().getId() 
                        : null)
                .message(notification.getMessage())
                .isRead(notification.isRead())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}

