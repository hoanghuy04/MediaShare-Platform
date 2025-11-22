package com.hoanghuy04.instagrambackend.entity.message;

import com.hoanghuy04.instagrambackend.entity.User;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.DocumentReference;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Entity representing a message between users.
 * Supports text and media content, threading, read receipts, and soft delete.
 *
 * @author Instagram Backend Team
 * @version 2.0.0
 */
@Data
@Builder
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Document(collection = "messages")
@CompoundIndex(name = "sender_receiver_idx", def = "{'sender': 1, 'receiver': 1}")
@CompoundIndex(name = "conversation_created_idx", def = "{'conversation': 1, 'createdAt': -1}")
public class Message {
    @Id
    String id;

    @DocumentReference
    @Indexed
    Conversation conversation;

    @DocumentReference
    User sender;

    @DocumentReference
    User receiver;

    String content;

    String mediaUrl;

    @Builder.Default
    List<String> readBy = new ArrayList<>();

    String replyToMessageId;

    @Builder.Default
    List<String> deletedBy = new ArrayList<>();

    LocalDateTime deletedAt;

    @CreatedDate
    @Indexed
    LocalDateTime createdAt;
}

