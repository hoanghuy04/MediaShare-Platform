package com.hoanghuy04.instagrambackend.service.message;

import com.hoanghuy04.instagrambackend.dto.response.MediaFileResponse;
import com.hoanghuy04.instagrambackend.entity.User;
import com.hoanghuy04.instagrambackend.entity.message.Conversation;
import com.hoanghuy04.instagrambackend.entity.message.ConversationMember;
import com.hoanghuy04.instagrambackend.entity.message.LastMessageInfo;
import com.hoanghuy04.instagrambackend.enums.ConversationType;
import com.hoanghuy04.instagrambackend.enums.MemberRole;
import com.hoanghuy04.instagrambackend.exception.BadRequestException;
import com.hoanghuy04.instagrambackend.exception.ResourceNotFoundException;
import com.hoanghuy04.instagrambackend.repository.UserRepository;
import com.hoanghuy04.instagrambackend.repository.message.ConversationRepository;
import com.hoanghuy04.instagrambackend.service.FileService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ConversationServiceImpl implements ConversationService {

    ConversationRepository conversationRepository;
    UserRepository userRepository;
    FileService fileService;
    MongoTemplate mongoTemplate;

    // ===============================
    // Direct & Group conversation
    // ===============================
    @Transactional(readOnly = true)
    @Override
    public Optional<Conversation> getExistingDirectConversation(String userId1, String userId2) {
        String key = directKeyOf(userId1, userId2);
        return conversationRepository.findByTypeAndDirectKey(ConversationType.DIRECT, key);
    }

    @Transactional
    @Override
    public Conversation createDirectConversation(String userId1, String userId2) {
        if (Objects.equals(userId1, userId2)) {
            throw new BadRequestException("Cannot create conversation with yourself");
        }

        // build participants + key
        String key = directKeyOf(userId1, userId2);
        List<String> sorted = Arrays.asList(userId1, userId2);
        sorted.sort(String::compareTo);
        List<ConversationMember> members = createConversationMembers(sorted, userId1, MemberRole.MEMBER);

        // upsert theo (type, directKey)
        Query q = new Query(Criteria.where("type").is(ConversationType.DIRECT).and("directKey").is(key));

        LocalDateTime now = LocalDateTime.now();
        Update u = new Update()
                .setOnInsert("type", ConversationType.DIRECT)
                .setOnInsert("directKey", key)
                .setOnInsert("participants", members)
                .setOnInsert("admins", Collections.emptyList())
                .setOnInsert("createdBy", userId1)
                .set("updatedAt", now)
                .setOnInsert("createdAt", now);

        FindAndModifyOptions opts = FindAndModifyOptions.options().upsert(true).returnNew(true);

        Conversation result = mongoTemplate.findAndModify(q, u, opts, Conversation.class);
        if (result == null) {
            // cực kỳ hiếm, nhưng để chắc chắn
            return conversationRepository.findByTypeAndDirectKey(ConversationType.DIRECT, key)
                    .orElseThrow(() -> new BadRequestException("Failed to create or fetch direct conversation"));
        }
        log.info("Direct conversation ready: {}", result.getId());
        return result;
    }

    @Transactional
    @Override
    public Conversation createGroupConversation(String creatorId, List<String> participantIds, String groupName) {
        if (groupName == null || groupName.trim().isEmpty()) {
            throw new BadRequestException("Group name is required");
        }
        List<String> all = new ArrayList<>(participantIds);
        if (!all.contains(creatorId)) all.add(creatorId);
        if (all.size() < 2) throw new BadRequestException("Group must have at least 2 participants");

        List<ConversationMember> members = createConversationMembers(all, creatorId, null);
        Conversation conversation = Conversation.builder()
                .type(ConversationType.GROUP)
                .name(groupName)
                .participants(members)
                .admins(Collections.singletonList(creatorId))
                .createdBy(creatorId)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        return conversationRepository.save(conversation);
    }

    // ===============================
    // Members management
    // ===============================
    @Transactional
    @Override
    public void addMember(String conversationId, String userId, String addedBy) {
        Conversation conversation = getConversationById(conversationId);
        if (conversation.getType() != ConversationType.GROUP) {
            throw new BadRequestException("Can only add members to group conversations");
        }
        if (!conversation.getAdmins().contains(addedBy)) {
            throw new BadRequestException("Only admins can add members");
        }
        boolean exists = conversation.getParticipants().stream().anyMatch(p -> p.getUserId().equals(userId));
        if (exists) throw new BadRequestException("User is already a member");

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        ConversationMember member = ConversationMember.builder()
                .userId(userId)
                .username(user.getUsername())
                .avatar(user.getProfile() != null ? user.getProfile().getAvatar() : null)
                .isVerified(user.isVerified())
                .joinedAt(LocalDateTime.now())
                .role(MemberRole.MEMBER)
                .build();

        conversation.getParticipants().add(member);
        conversation.setUpdatedAt(LocalDateTime.now());
        conversationRepository.save(conversation);
    }

    @Transactional
    @Override
    public void removeMember(String conversationId, String userId, String removedBy) {
        Conversation conversation = getConversationById(conversationId);
        if (conversation.getType() != ConversationType.GROUP) {
            throw new BadRequestException("Can only remove members from group conversations");
        }
        if (!conversation.getAdmins().contains(removedBy)) {
            throw new BadRequestException("Only admins can remove members");
        }
        if (userId.equals(removedBy)) {
            throw new BadRequestException("Use leave group to remove yourself");
        }

        conversation.getParticipants().stream()
                .filter(m -> m.getUserId().equals(userId) && m.getLeftAt() == null)
                .findFirst()
                .ifPresent(m -> {
                    m.setLeftAt(LocalDateTime.now());
                    conversation.getLeftMembers().add(m);
                });

        conversation.getParticipants().removeIf(m -> m.getUserId().equals(userId));
        conversation.setUpdatedAt(LocalDateTime.now());
        conversationRepository.save(conversation);
    }

    @Transactional
    @Override
    public void leaveGroup(String conversationId, String userId) {
        Conversation conversation = getConversationById(conversationId);
        boolean isMember = conversation.getParticipants().stream().anyMatch(p -> p.getUserId().equals(userId));
        if (!isMember) throw new BadRequestException("You are not a member of this conversation");
        if (conversation.getType() == ConversationType.DIRECT) {
            throw new BadRequestException("Cannot leave a direct conversation");
        }

        if (conversation.getAdmins().contains(userId) && conversation.getAdmins().size() == 1) {
            List<String> regular = conversation.getParticipants().stream()
                    .map(ConversationMember::getUserId)
                    .filter(id -> !id.equals(userId))
                    .collect(Collectors.toList());
            if (!regular.isEmpty()) {
                String newAdmin = regular.get(0);
                conversation.setAdmins(Collections.singletonList(newAdmin));
                conversation.getParticipants().stream()
                        .filter(m -> m.getUserId().equals(newAdmin))
                        .findFirst()
                        .ifPresent(m -> m.setRole(MemberRole.ADMIN));
            }
        }

        conversation.getAdmins().remove(userId);
        conversation.getParticipants().stream()
                .filter(m -> m.getUserId().equals(userId) && m.getLeftAt() == null)
                .findFirst()
                .ifPresent(m -> {
                    m.setLeftAt(LocalDateTime.now());
                    conversation.getLeftMembers().add(m);
                });

        conversation.getParticipants().removeIf(m -> m.getUserId().equals(userId));
        conversation.setUpdatedAt(LocalDateTime.now());
        conversationRepository.save(conversation);
    }

    @Override
    public Conversation updateGroupInfo(String conversationId, String name, String avatar, String updatedByUserId) {
        Conversation conversation = getConversationById(conversationId);
        if (conversation.getType() != ConversationType.GROUP) {
            throw new BadRequestException("Can only update group conversations");
        }
        if (conversation.getAdmins() == null || !conversation.getAdmins().contains(updatedByUserId)) {
            throw new BadRequestException("Only admins can update group info");
        }

        if (name != null) {
            String trimmed = name.trim();
            if (trimmed.isEmpty()) throw new BadRequestException("Group name cannot be blank");
            conversation.setName(trimmed);
        }

        if (avatar != null) {
            if ("__REMOVE__".equals(avatar)) {
                conversation.setAvatar(null);
            } else {
                String avatarFileId = avatar.trim();
                if (avatarFileId.isEmpty()) {
                    throw new BadRequestException("avatarFileId cannot be blank. Use \"__REMOVE__\" to clear avatar.");
                }
                MediaFileResponse media = fileService.getMediaFileResponse(avatarFileId);
                conversation.setAvatar(media.getId());
            }
        }

        conversation.setUpdatedAt(LocalDateTime.now());
        return conversationRepository.save(conversation);
    }

    // ===============================
    // Misc
    // ===============================
    @Transactional(readOnly = true)
    @Override
    public List<Conversation> getUserConversations(String userId) {
        return conversationRepository.findByParticipantsContainingAndDeletedByNotContaining(userId, userId);
    }

    @Transactional
    @Override
    public void updateLastMessage(String conversationId, com.hoanghuy04.instagrambackend.entity.message.Message message) {
        Conversation conversation = getConversationById(conversationId);
        LastMessageInfo lastMessage = LastMessageInfo.builder()
                .messageId(message.getId())
                .content(message.getContent() != null ? message.getContent() : "[Media]")
                .senderId(message.getSender().getId())
                .timestamp(message.getCreatedAt())
                .build();
        conversation.setLastMessage(lastMessage);
        conversation.setUpdatedAt(LocalDateTime.now());
        conversationRepository.save(conversation);
    }

    @Transactional(readOnly = true)
    @Override
    public boolean isParticipant(String conversationId, String userId) {
        Conversation conversation = getConversationById(conversationId);
        return conversation.getParticipants().stream().anyMatch(p -> p.getUserId().equals(userId));
    }

    @Transactional(readOnly = true)
    @Override
    public Conversation getConversationById(String conversationId) {
        return conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found with id: " + conversationId));
    }

    // ===============================
    // Helpers
    // ===============================
    @Override
    public String directKeyOf(String u1, String u2) {
        if (u1 == null || u2 == null) throw new BadRequestException("Participant IDs cannot be null");
        List<String> a = Arrays.asList(u1, u2);
        a.sort(String::compareTo);
        return a.get(0) + "#" + a.get(1);
    }

    private List<ConversationMember> createConversationMembers(List<String> userIds, String creatorId, MemberRole defaultRole) {
        List<ConversationMember> members = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();
        for (String userId : userIds) {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

            MemberRole role = (defaultRole != null) ? defaultRole : (userId.equals(creatorId) ? MemberRole.ADMIN : MemberRole.MEMBER);

            ConversationMember member = ConversationMember.builder()
                    .userId(userId)
                    .username(user.getUsername())
                    .avatar(user.getProfile() != null ? user.getProfile().getAvatar() : null)
                    .isVerified(user.isVerified())
                    .joinedAt(now)
                    .role(role)
                    .build();
            members.add(member);
        }
        return members;
    }
}
