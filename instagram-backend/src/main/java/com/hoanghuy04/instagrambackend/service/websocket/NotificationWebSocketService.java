package com.hoanghuy04.instagrambackend.service.websocket;

import com.hoanghuy04.instagrambackend.dto.response.NotificationResponse;

/*
 * @description: NotificationWebSocketService
 * @author: Trần Ngọc Huyền
 * @date: 11/26/2025
 * @version: 1.0
 */
public interface NotificationWebSocketService {

    /**
     * Gửi 1 notification tới 1 user cụ thể
     */
    void pushNotification(String receiverId, NotificationResponse notification);

    /**
     * (Optional) Gửi cho nhiều user nếu sau này cần
     */
    default void pushNotificationToUsers(Iterable<String> receiverIds, NotificationResponse notification) {
        for (String id : receiverIds) {
            pushNotification(id, notification);
        }
    }
}