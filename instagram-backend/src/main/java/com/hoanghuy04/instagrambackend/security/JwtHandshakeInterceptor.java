package com.hoanghuy04.instagrambackend.security;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Map;

/**
 * JWT handshake interceptor for WebSocket connections.
 * Validates JWT tokens during WebSocket handshake process.
 * 
 * @author Instagram Backend Team
 * @version 1.0.0
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtHandshakeInterceptor implements HandshakeInterceptor {
    
    private final JwtUtil jwtUtil;
    
    /**
     * Intercept the WebSocket handshake request.
     * Validates JWT token from query parameters or headers.
     *
     * @param request the HTTP request
     * @param response the HTTP response
     * @param wsHandler the WebSocket handler
     * @param attributes the session attributes
     * @return true if handshake should proceed, false otherwise
     */
    @Override
    public boolean beforeHandshake(@NonNull ServerHttpRequest request, @NonNull ServerHttpResponse response,
                                 @NonNull WebSocketHandler wsHandler, @NonNull Map<String, Object> attributes) {
        
        try {
            log.info("WebSocket handshake attempt from: {}", request.getRemoteAddress());
            log.info("Request URI: {}", request.getURI());
            log.info("Request headers: {}", request.getHeaders());
            
            // Extract JWT token from query parameters or headers
            String token = extractTokenFromRequest(request);
            log.info("Extracted token: {}", token != null ? "Present" : "Missing");
            
            if (StringUtils.hasText(token) && jwtUtil.validateToken(token)) {
                String username = jwtUtil.extractUsername(token);
                String userId = jwtUtil.extractUserId(token);
                
                log.info("Token validation successful for user: {} (ID: {})", username, userId);
                
                // Store user information in session attributes
                attributes.put("username", username);
                attributes.put("userId", userId);
                attributes.put("token", token);
                
                log.info("WebSocket handshake successful for user: {}", username);
                return true;
            } else {
                log.warn("WebSocket handshake failed: Invalid or missing JWT token");
                return false;
            }
            
        } catch (Exception ex) {
            log.error("Error during WebSocket handshake", ex);
            return false;
        }
    }
    
    /**
     * Called after handshake is completed.
     * 
     * @param request the HTTP request
     * @param response the HTTP response
     * @param wsHandler the WebSocket handler
     * @param exception any exception that occurred
     */
    @Override
    public void afterHandshake(@NonNull ServerHttpRequest request, @NonNull ServerHttpResponse response,
                              @NonNull WebSocketHandler wsHandler, @Nullable Exception exception) {
        if (exception != null) {
            log.error("WebSocket handshake failed", exception);
        } else {
            log.debug("WebSocket handshake completed successfully");
        }
    }
    
    /**
     * Extract JWT token from request query parameters or headers.
     * Updated to prioritize query parameters for SockJS compatibility.
     *
     * @param request the HTTP request
     * @return JWT token or null if not found
     */
    private String extractTokenFromRequest(ServerHttpRequest request) {
        log.info("Extracting token from request...");
        
        // Priority 1: Try to get token from query parameters (SockJS compatibility)
        String query = request.getURI().getQuery();
        log.info("Query string: {}", query);
        
        if (StringUtils.hasText(query)) {
            // Parse query string to find token parameter
            String[] params = query.split("&");
            for (String param : params) {
                log.info("Checking param: {}", param);
                if (param.startsWith("token=")) {
                    String token = param.substring(6); // Remove "token=" prefix
                    if (StringUtils.hasText(token)) {
                        log.info("Found token in query: {}", token.substring(0, Math.min(20, token.length())) + "...");
                        return token;
                    }
                }
            }
        }
        
        // Priority 2: Try to get token from Authorization header (fallback)
        String authHeader = request.getHeaders().getFirst("Authorization");
        log.info("Authorization header: {}", authHeader);
        if (StringUtils.hasText(authHeader) && authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7); // Remove "Bearer " prefix
            if (StringUtils.hasText(token)) {
                log.info("Found token in Authorization header: {}", token.substring(0, Math.min(20, token.length())) + "...");
                return token;
            }
        }
        
        // Priority 3: Try to get token from custom header (fallback)
        String customToken = request.getHeaders().getFirst("X-Auth-Token");
        log.info("X-Auth-Token header: {}", customToken);
        if (StringUtils.hasText(customToken) && customToken != null) {
            log.info("Found token in X-Auth-Token header: {}", customToken.substring(0, Math.min(20, customToken.length())) + "...");
            return customToken;
        }
        
        log.warn("No token found in request");
        return null;
    }
}
