package com.hoanghuy04.instagrambackend.entity.conversation;

import com.hoanghuy04.instagrambackend.enums.MemberRole;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

/**
 * Embedded class representing a member in a conversation.
 * Tracks member participation, roles, user info, and join/leave times.
 *
 * @author Instagram Backend Team
 * @version 2.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ConversationMember {

    String userId;

    String username;

    String avatar;

    boolean isVerified;

    LocalDateTime joinedAt;

    LocalDateTime leftAt;

    MemberRole role;
}


