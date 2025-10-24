package com.hoanghuy04.instagrambackend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * WebSocket configuration for real-time messaging.
 * Enables STOMP protocol over WebSocket for bidirectional communication.
 * 
 * @author Instagram Backend Team
 * @version 1.0.0
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    /**
     * Configure message broker for handling messages.
     * - /app: prefix for messages bound for @MessageMapping methods
     * - /topic: for broadcasting to all subscribers
     * - /queue: for point-to-point messaging
     * - /user: for user-specific messaging
     */
    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Enable simple broker for /topic and /queue destinations
        registry.enableSimpleBroker("/topic", "/queue", "/user");
        
        // Set prefix for messages bound for @MessageMapping methods
        registry.setApplicationDestinationPrefixes("/app");
        
        // Set prefix for user-specific destinations
        registry.setUserDestinationPrefix("/user");
    }

    /**
     * Register STOMP endpoints for clients to connect.
     * Endpoint: /ws
     * With SockJS fallback for browsers that don't support WebSocket
     */
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")  // Allow all origins (configure for production)
                .withSockJS();  // Enable SockJS fallback
    }
}

