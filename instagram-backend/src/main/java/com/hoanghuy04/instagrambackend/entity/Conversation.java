package com.hoanghuy04.instagrambackend.entity;

import com.hoanghuy04.instagrambackend.entity.conversation.ConversationMember;
import com.hoanghuy04.instagrambackend.entity.conversation.ConversationTheme;
import com.hoanghuy04.instagrambackend.entity.conversation.LastMessageInfo;
import com.hoanghuy04.instagrambackend.enums.ConversationType;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.annotation.*;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Document(collection = "conversations")
@CompoundIndex(name = "participants_userId_idx", def = "{'participants.userId': 1}")
@CompoundIndex(name = "type_participants_idx", def = "{'type': 1, 'participants.userId': 1}")
public class Conversation {
    @Id
    String id;

    ConversationType type;
    String name;
    String avatar;

    String directKey;

    @Builder.Default
    List<ConversationMember> participants = new ArrayList<>();

    @Builder.Default
    List<String> admins = new ArrayList<>();

    String createdBy;

    @Builder.Default
    List<ConversationMember> leftMembers = new ArrayList<>();

    @Builder.Default
    List<String> deletedBy = new ArrayList<>();

    @CreatedDate
    LocalDateTime createdAt;
    @LastModifiedDate
    LocalDateTime updatedAt;

    LastMessageInfo lastMessage;

    ConversationTheme theme;
    String wallpaperUrl;

    public Conversation(String id) {
        this.id = id;
    }
}
