package com.hoanghuy04.instagrambackend.service.authentication;

import com.hoanghuy04.instagrambackend.dto.request.LoginRequest;
import com.hoanghuy04.instagrambackend.dto.request.RegisterRequest;
import com.hoanghuy04.instagrambackend.dto.response.AuthResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service interface for authentication operations.
 * Handles user registration, login, and token management.
 * 
 * @author Instagram Backend Team
 * @version 1.0.0
 */
@Service
public interface AuthService {
    
    /**
     * Register a new user.
     *
     * @param request the registration request
     * @return AuthResponse with tokens and user data
     */
    @Transactional
    AuthResponse register(RegisterRequest request);

    /**
     * Login a user.
     *
     * @param request the login request
     * @return AuthResponse with tokens and user data
     */
    @Transactional
    AuthResponse login(LoginRequest request);

    /**
     * Refresh access token using refresh token.
     *
     * @param refreshToken the refresh token
     * @return AuthResponse with new tokens
     */
    AuthResponse refreshToken(String refreshToken);

    /**
     * Logout a user (client-side token removal).
     *
     * @param userId the user ID
     */
    void logout(String userId);

    /**
     * Validate a JWT token.
     *
     * @param token the JWT token
     * @return true if valid, false otherwise
     */
    boolean validateToken(String token);

    /**
     * Send password reset email.
     *
     * @param email the user email
     */
    void sendPasswordResetEmail(String email);

    /**
     * Reset password with token.
     *
     * @param token the reset token
     * @param newPassword the new password
     */
    @Transactional
    void resetPassword(String token, String newPassword);
}
