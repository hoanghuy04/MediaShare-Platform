package com.hoanghuy04.instagrambackend.dto.response;

import com.hoanghuy04.instagrambackend.enums.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for notification response data.
 * 
 * @author Instagram Backend Team
 * @version 1.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {

    private String id;
    private NotificationType type;
    
    // Navigation fields
    private String senderId;
    private String postId;

    private UserSummaryResponse author;

    private String content;
    private String postThumbnail;

    private String createdAt;
    private boolean read;

    private boolean isFollowingBack;
    private boolean isLikeComment;
}


