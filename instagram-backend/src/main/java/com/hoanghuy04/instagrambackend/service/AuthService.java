package com.hoanghuy04.instagrambackend.service;

import com.hoanghuy04.instagrambackend.dto.request.LoginRequest;
import com.hoanghuy04.instagrambackend.dto.request.RegisterRequest;
import com.hoanghuy04.instagrambackend.dto.response.AuthResponse;
import com.hoanghuy04.instagrambackend.dto.response.UserResponse;
import com.hoanghuy04.instagrambackend.entity.User;
import com.hoanghuy04.instagrambackend.entity.UserProfile;
import com.hoanghuy04.instagrambackend.enums.UserRole;
import com.hoanghuy04.instagrambackend.exception.BadRequestException;
import com.hoanghuy04.instagrambackend.exception.ConflictException;
import com.hoanghuy04.instagrambackend.exception.UnauthorizedException;
import com.hoanghuy04.instagrambackend.repository.UserRepository;
import com.hoanghuy04.instagrambackend.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;

/**
 * Service class for authentication operations.
 * Handles user registration, login, and token management.
 * 
 * @author Instagram Backend Team
 * @version 1.0.0
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final UserService userService;
    
    /**
     * Register a new user.
     *
     * @param request the registration request
     * @return AuthResponse with tokens and user data
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        log.info("Registering new user: {}", request.getUsername());
        
        // Check if username exists
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new ConflictException("Username is already taken");
        }
        
        // Check if email exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ConflictException("Email is already registered");
        }
        
        // Create user profile
        UserProfile profile = UserProfile.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .build();
        
        // Create user roles
        Set<UserRole> roles = new HashSet<>();
        roles.add(UserRole.USER);
        
        // Create user
        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .profile(profile)
                .roles(roles)
                .isPrivate(false)
                .isVerified(false)
                .isActive(true)
                .build();
        
        user = userRepository.save(user);
        log.info("User registered successfully: {}", user.getUsername());
        
        // Generate tokens
        String accessToken = jwtUtil.generateToken(user.getUsername());
        String refreshToken = jwtUtil.generateRefreshToken(user.getUsername());
        
        // Convert to response
        UserResponse userResponse = userService.convertToUserResponse(user);
        
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .user(userResponse)
                .build();
    }
    
    /**
     * Login a user.
     *
     * @param request the login request
     * @return AuthResponse with tokens and user data
     */
    @Transactional
    public AuthResponse login(LoginRequest request) {
        log.info("User attempting to login: {}", request.getUsernameOrEmail());
        
        // Find user by username or email
        User user = userRepository.findByUsername(request.getUsernameOrEmail())
                .or(() -> userRepository.findByEmail(request.getUsernameOrEmail()))
                .orElseThrow(() -> new BadRequestException("Invalid username/email or password"));
        
        if (!user.isActive()) {
            throw new UnauthorizedException("User account is not active");
        }
        
        // Authenticate
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(user.getUsername(), request.getPassword())
        );
        
        SecurityContextHolder.getContext().setAuthentication(authentication);
        
        // Generate tokens
        String accessToken = jwtUtil.generateToken(user.getUsername());
        String refreshToken = jwtUtil.generateRefreshToken(user.getUsername());
        
        log.info("User logged in successfully: {}", user.getUsername());
        
        // Convert to response
        UserResponse userResponse = userService.convertToUserResponse(user);
        
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .user(userResponse)
                .build();
    }
    
    /**
     * Refresh access token using refresh token.
     *
     * @param refreshToken the refresh token
     * @return AuthResponse with new tokens
     */
    public AuthResponse refreshToken(String refreshToken) {
        log.info("Refreshing access token");
        
        if (!jwtUtil.validateToken(refreshToken)) {
            throw new UnauthorizedException("Invalid or expired refresh token");
        }
        
        String username = jwtUtil.extractUsername(refreshToken);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BadRequestException("User not found"));
        
        if (!user.isActive()) {
            throw new UnauthorizedException("User account is not active");
        }
        
        // Generate new tokens
        String newAccessToken = jwtUtil.generateToken(username);
        String newRefreshToken = jwtUtil.generateRefreshToken(username);
        
        UserResponse userResponse = userService.convertToUserResponse(user);
        
        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .tokenType("Bearer")
                .user(userResponse)
                .build();
    }
    
    /**
     * Logout a user (client-side token removal).
     *
     * @param userId the user ID
     */
    public void logout(String userId) {
        log.info("User logged out: {}", userId);
        SecurityContextHolder.clearContext();
    }
    
    /**
     * Validate a JWT token.
     *
     * @param token the JWT token
     * @return true if valid, false otherwise
     */
    public boolean validateToken(String token) {
        return jwtUtil.validateToken(token);
    }
    
    /**
     * Send password reset email.
     *
     * @param email the user email
     */
    public void sendPasswordResetEmail(String email) {
        log.info("Sending password reset email to: {}", email);
        
        // Check if email exists
        userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("Email not found"));
        
        // TODO: Implement email service to send reset link
        // For now, just log the action
        log.info("Password reset email would be sent to: {}", email);
    }
    
    /**
     * Reset password with token.
     *
     * @param token the reset token
     * @param newPassword the new password
     */
    @Transactional
    public void resetPassword(String token, String newPassword) {
        log.info("Resetting password with token");
        
        // TODO: Implement token validation and password reset logic
        // For now, just log the action
        log.info("Password reset would be processed for token: {}", token);
    }
}

