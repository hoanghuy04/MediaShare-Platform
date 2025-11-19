package com.hoanghuy04.instagrambackend.service.notification;

import com.hoanghuy04.instagrambackend.dto.response.NotificationResponse;
import com.hoanghuy04.instagrambackend.dto.response.PageResponse;
import com.hoanghuy04.instagrambackend.entity.Notification;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public interface NotificationService {
    @Transactional
    void createNotification(Notification notification);

    @Transactional(readOnly = true)
    PageResponse<NotificationResponse> getNotifications(String userId, Pageable pageable);

    @Transactional
    void markAsRead(String notificationId);

    @Transactional
    void deleteNotification(String notificationId);

    @Transactional(readOnly = true)
    long getUnreadCount(String userId);
}
