package com.hoanghuy04.instagrambackend.mapper;

import com.hoanghuy04.instagrambackend.dto.response.UserResponse;
import com.hoanghuy04.instagrambackend.dto.response.UserSummaryResponse;
import com.hoanghuy04.instagrambackend.entity.User;
import com.hoanghuy04.instagrambackend.entity.UserProfile;
import com.hoanghuy04.instagrambackend.service.FileService;
import lombok.extern.slf4j.Slf4j;
import org.mapstruct.*;
import org.springframework.beans.factory.annotation.Autowired;

/**
 * Mapper for User entities and DTOs.
 * Handles conversion between User entity and various response DTOs.
 *
 * @author Instagram Backend Team
 * @version 1.0.0
 */
@Mapper(
        componentModel = "spring",
        unmappedTargetPolicy = ReportingPolicy.IGNORE,
        injectionStrategy = InjectionStrategy.FIELD
)
@Slf4j
public abstract class UserMapper {

    @Autowired
    protected FileService fileService;

    /**
     * Convert User entity to UserResponse DTO
     */
    @Mappings({
            @Mapping(target = "profile", expression = "java(getProfileWithAvatarUrl(user.getProfile()))"),
    })
    public abstract UserResponse toUserResponse(User user);

    /**
     * Convert User entity to UserSummaryResponse DTO
     */
    public UserSummaryResponse toUserSummary(User user) {
        if (user == null) {
            return null;
        }

        return UserSummaryResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .avatar(getProfileWithAvatarUrl(user.getProfile()).getAvatar())
                .isVerified(user.isVerified())
                .followingByCurrentUser(false)
                .build();
    }

    /**
     * Convert User entity to UserSummaryResponse DTO with followingByCurrentUser status
     */
    public UserSummaryResponse toUserSummary(User user, boolean followingByCurrentUser) {
        if (user == null) {
            return null;
        }

        return UserSummaryResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .avatar(getProfileWithAvatarUrl(user.getProfile()).getAvatar())
                .isVerified(user.isVerified())
                .followingByCurrentUser(followingByCurrentUser)
                .build();
    }

    /**
     * Get UserProfile with resolved avatar URL
     */
    public UserProfile getProfileWithAvatarUrl(UserProfile userProfile) {
        if (userProfile == null) {
            return null;
        }

        String avatarPath = userProfile.getAvatar();
        if (avatarPath == null || avatarPath.isBlank()) {
            return userProfile;
        }

        try {
            String resolvedUrl = fileService.getMediaFileResponse(avatarPath).getUrl();
            UserProfile clonedProfile = UserProfile.builder()
                    .firstName(userProfile.getFirstName())
                    .lastName(userProfile.getLastName())
                    .bio(userProfile.getBio())
                    .avatar(resolvedUrl)
                    .website(userProfile.getWebsite())
                    .location(userProfile.getLocation())
                    .build();
            return clonedProfile;
        } catch (Exception e) {
            log.warn("Error fetching avatar URL for path: {}", avatarPath);
            return userProfile;
        }
    }
}
