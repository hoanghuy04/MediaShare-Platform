package com.hoanghuy04.instagrambackend.entity.message;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

/**
 * Embedded class representing the last message in a conversation.
 * Used for quick display in conversation lists without loading all messages.
 * 
 * @author Instagram Backend Team
 * @version 2.0.0
 */
@Data
@Builder
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class LastMessageInfo {
    private String messageId;
    private String content;
    private String senderId;
    private LocalDateTime timestamp;
}


