package com.hoanghuy04.instagrambackend.entity;

import com.hoanghuy04.instagrambackend.enums.MessageType;
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
 * The meaning of 'content' depends on 'type':
 * - TEXT: content is the actual text message
 * - IMAGE: content is the mediaFileId of an image
 * - VIDEO: content is the mediaFileId of a video
 * - POST_SHARE: content is the postId of a shared post
 *
 * @author Instagram Backend Team
 * @version 2.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
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

    /**
     * Type of the message (TEXT, IMAGE, VIDEO, POST_SHARE)
     */
    @Indexed
    @Builder.Default
    MessageType type = MessageType.TEXT;

    /**
     * Content of the message. Meaning depends on type:
     * - TEXT: actual text content
     * - IMAGE/VIDEO: mediaFileId
     * - POST_SHARE: postId
     */
    String content;

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

