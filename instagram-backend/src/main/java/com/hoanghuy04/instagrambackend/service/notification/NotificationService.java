package com.hoanghuy04.instagrambackend.service.notification;

import com.hoanghuy04.instagrambackend.dto.response.NotificationResponse;
import com.hoanghuy04.instagrambackend.dto.response.PageResponse;
import org.springframework.data.domain.Pageable;

public interface NotificationService {

    NotificationResponse createFollowNotification(String receiverId);

    NotificationResponse createLikePostNotification(String receiverId, String postId);

    NotificationResponse createLikeCommentNotification(String receiverId, String postId, String commentId);

    NotificationResponse createCommentPostNotification(String receiverId, String postId, String message);

    // TAG @ trong comment
    NotificationResponse createTagInCommentNotification(String receiverId, String postId, String commentId);

    PageResponse<NotificationResponse> getUserNotifications(Pageable pageable);

    void markAsRead(String notificationId);

    com.hoanghuy04.instagrambackend.dto.response.UnreadCountResponse getUnreadCount();

    void markAllAsRead();
}



