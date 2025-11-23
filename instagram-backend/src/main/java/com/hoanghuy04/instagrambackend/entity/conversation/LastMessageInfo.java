package com.hoanghuy04.instagrambackend.entity.conversation;

import com.hoanghuy04.instagrambackend.enums.MessageType;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

/**
 * Embedded class representing the last message in a conversation.
 * Used for quick display in conversation lists without loading all messages.
 * Content contains a human-readable preview based on message type.
 * 
 * @author Instagram Backend Team
 * @version 2.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class LastMessageInfo {
    private String messageId;
    private MessageType type;
    private String content; // Human-readable preview text
    private String senderId;
    private String senderUsername;
    private LocalDateTime timestamp;
}


