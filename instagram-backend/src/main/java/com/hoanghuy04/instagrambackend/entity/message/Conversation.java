package com.hoanghuy04.instagrambackend.entity.message;

import com.hoanghuy04.instagrambackend.enums.ConversationType;
import lombok.*;
import org.springframework.data.annotation.*;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
@Document(collection = "conversations")
@CompoundIndex(name = "participants_userId_idx", def = "{'participants.userId': 1}")
@CompoundIndex(name = "type_participants_idx", def = "{'type': 1, 'participants.userId': 1}")
@CompoundIndex(
        name = "direct_participants_normalized_unique_idx",
        def = "{'type': 1, 'participantsNormalized': 1}",
        unique = true,
        partialFilter = "{'type': 'DIRECT'}"
)
public class Conversation {
    @Id private String id;
    private ConversationType type;
    private String name;
    private String avatar;

    @Builder.Default
    private List<ConversationMember> participants = new ArrayList<>();

    @Builder.Default
    private List<String> participantsNormalized = new ArrayList<>();

    @Builder.Default
    private List<String> admins = new ArrayList<>();

    private String createdBy;

    @Builder.Default
    private List<ConversationMember> leftMembers = new ArrayList<>();

    @Builder.Default
    private List<String> deletedBy = new ArrayList<>();

    @CreatedDate private LocalDateTime createdAt;
    @LastModifiedDate private LocalDateTime updatedAt;

    private LastMessageInfo lastMessage;

    private ConversationTheme theme;
    private String wallpaperUrl;

}
