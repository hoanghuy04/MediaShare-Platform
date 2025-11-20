package com.hoanghuy04.instagrambackend.util;

import com.hoanghuy04.instagrambackend.entity.User;
import com.hoanghuy04.instagrambackend.exception.UnauthorizedException;
import com.hoanghuy04.instagrambackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

/**
 * Utility component to fetch the currently authenticated user from Spring Security.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SecurityUtil {

    private final UserRepository userRepository;

    /**
     * Retrieve the currently authenticated user.
     *
     * @return User entity
     */
    public User getCurrentUser() {
        String username = getCurrentUsername();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UnauthorizedException("Authenticated user not found"));
    }

    /**
     * Retrieve the currently authenticated user's ID.
     *
     * @return user ID string
     */
    public String getCurrentUserId() {
        return getCurrentUser().getId();
    }

    private String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new UnauthorizedException("User is not authenticated");
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof UserDetails userDetails) {
            return userDetails.getUsername();
        }

        if (principal instanceof String username &&
                !"anonymousUser".equalsIgnoreCase(username)) {
            return username;
        }

        log.warn("Unknown authentication principal type: {}", principal);
        throw new UnauthorizedException("Unable to determine authenticated user");
    }
}

