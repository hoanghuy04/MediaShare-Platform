package com.hoanghuy04.instagrambackend.service.authentication;

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
import com.hoanghuy04.instagrambackend.service.user.UserService;
import com.hoanghuy04.instagrambackend.service.user.UserServiceImpl;
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
public class AuthServiceImpl implements AuthService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final UserService userService;
    
    @Transactional
    @Override
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
        String accessToken = jwtUtil.generateToken(user.getUsername(), user.getId());
        String refreshToken = jwtUtil.generateRefreshToken(user.getUsername(), user.getId());
        
        // Convert to response
        UserResponse userResponse = userService.convertToUserResponse(user);
        
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .user(userResponse)
                .build();
    }
    
    @Transactional
    @Override
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
        String accessToken = jwtUtil.generateToken(user.getUsername(), user.getId());
        String refreshToken = jwtUtil.generateRefreshToken(user.getUsername(), user.getId());
        
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
    
    @Override
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
        String newAccessToken = jwtUtil.generateToken(username, user.getId());
        String newRefreshToken = jwtUtil.generateRefreshToken(username, user.getId());
        
        UserResponse userResponse = userService.convertToUserResponse(user);
        
        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .tokenType("Bearer")
                .user(userResponse)
                .build();
    }
    
    @Override
    public void logout(String userId) {
        log.info("User logged out: {}", userId);
        SecurityContextHolder.clearContext();
    }
    
    @Override
    public boolean validateToken(String token) {
        return jwtUtil.validateToken(token);
    }
    
    @Override
    public void sendPasswordResetEmail(String email) {
        log.info("Sending password reset email to: {}", email);
        
        // Check if email exists
        userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("Email not found"));
        
        // TODO: Implement email service to send reset link
        // For now, just log the action
        log.info("Password reset email would be sent to: {}", email);
    }
    
    @Transactional
    @Override
    public void resetPassword(String token, String newPassword) {
        log.info("Resetting password with token");
        
        // TODO: Implement token validation and password reset logic
        // For now, just log the action
        log.info("Password reset would be processed for token: {}", token);
    }
}

