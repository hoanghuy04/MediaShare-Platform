package com.hoanghuy04.instagrambackend.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.util.Map;

/**
 * WebSocket event listener for handling connection events.
 * Logs and handles user connections and disconnections.
 * 
 * @author Instagram Backend Team
 * @version 1.0.0
 */
@Slf4j
@Component
public class WebSocketEventListener {

    /**
     * Handle WebSocket connection event.
     * Called when a client successfully connects to the WebSocket.
     */
    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        try {
            StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
            String sessionId = headerAccessor.getSessionId();
            
            log.info("WebSocket connection established. Session ID: {}", sessionId);
            
            // You can extract user info from headers if needed (with null check)
            Map<String, Object> sessionAttributes = headerAccessor.getSessionAttributes();
            if (sessionAttributes != null) {
                String username = (String) sessionAttributes.get("username");
                if (username != null) {
                    log.info("User {} connected via WebSocket", username);
                }
            }
        } catch (Exception e) {
            log.error("Error handling WebSocket connection event", e);
        }
    }

    /**
     * Handle WebSocket disconnection event.
     * Called when a client disconnects from the WebSocket.
     */
    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        try {
            StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
            String sessionId = headerAccessor.getSessionId();
            
            log.info("WebSocket connection closed. Session ID: {}", sessionId);
            
            // Safely extract user info from headers (with null check)
            Map<String, Object> sessionAttributes = headerAccessor.getSessionAttributes();
            if (sessionAttributes != null) {
                String username = (String) sessionAttributes.get("username");
                if (username != null) {
                    log.info("User {} disconnected from WebSocket", username);
                    
                    // Notify others that user went offline (optional)
                    // messagingTemplate.convertAndSend("/topic/user/offline", username);
                }
            }
        } catch (Exception e) {
            log.error("Error handling WebSocket disconnection event", e);
        }
    }
}

