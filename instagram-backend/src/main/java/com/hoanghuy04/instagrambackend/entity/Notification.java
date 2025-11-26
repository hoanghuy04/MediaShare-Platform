package com.hoanghuy04.instagrambackend.entity;

import com.hoanghuy04.instagrambackend.enums.NotificationType;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "notifications")
public class Notification {

    @Id
    private String id;

    private String receiverId;

    private String senderId;

    private NotificationType type;

    private String postId;         // LIKE_POST, COMMENT_POST, LIKE_COMMENT, TAG_IN_POST, TAG_IN_COMMENT
    private String commentId;      // COMMENT_POST, LIKE_COMMENT, TAG_IN_COMMENT
    private String conversationId; // NEW_MESSAGE
    private String messageId;      // NEW_MESSAGE

    private String title;
    private String message;

    private boolean read;

    private Instant createdAt;
}
