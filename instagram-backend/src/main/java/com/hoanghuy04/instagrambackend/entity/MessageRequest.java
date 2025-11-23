package com.hoanghuy04.instagrambackend.entity;

import com.hoanghuy04.instagrambackend.enums.RequestStatus;
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
 * Entity representing a message request.
 * Created when users who are not connected try to message each other.
 *
 * @author Instagram Backend Team
 * @version 2.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Document(collection = "message_requests")
@CompoundIndex(name = "receiver_status_idx", def = "{'receiver': 1, 'status': 1}")
public class MessageRequest {

    @Id
    String id;

    @Indexed
    String senderId;

    @Indexed
    String receiverId;

    @DocumentReference(lazy = true)
    User sender;

    @DocumentReference(lazy = true)
    User receiver;

    RequestStatus status;

    String lastMessageContent;

    LocalDateTime lastMessageTimestamp;

    @Builder.Default
    List<String> pendingMessageIds = new ArrayList<>();

    @CreatedDate
    LocalDateTime createdAt;

    LocalDateTime respondedAt;
}


