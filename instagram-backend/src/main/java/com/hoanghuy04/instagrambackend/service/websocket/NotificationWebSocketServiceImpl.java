package com.hoanghuy04.instagrambackend.service.websocket;

import com.hoanghuy04.instagrambackend.dto.response.NotificationResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationWebSocketServiceImpl implements NotificationWebSocketService {

    private final SimpMessagingTemplate messagingTemplate;

    @Override
    public void pushNotification(String receiverId, NotificationResponse notification) {
        try {
            // Gửi đến user-specific destination
            messagingTemplate.convertAndSendToUser(
                    receiverId,              // userId (trùng với ChatUserPrincipal.getName())
                    "/queue/notifications",  // đích cho user đó
                    notification
            );
        } catch (Exception e) {
            log.error("Error sending notification to user {} via WebSocket", receiverId, e);
        }
    }
}

