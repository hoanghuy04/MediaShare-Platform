package com.hoanghuy04.instagrambackend.entity;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Document(collection = "conversation_invite_links")
@CompoundIndex(name = "conversation_token_idx", def = "{'conversationId': 1, 'token': 1}", unique = true)
public class ConversationInviteLink {

    @Id
    String id;

    String conversationId;

    String token;

    String createdBy;

    @CreatedDate
    LocalDateTime createdAt;

    LocalDateTime expiresAt; // null = never expire

    Integer maxUses;         // null = unlimited

    @Builder.Default
    Integer usedCount = 0;

    @Builder.Default
    Boolean active = true;   // true: usable, false: revoked/expired

    String revokedBy;

    LocalDateTime revokedAt;
}

