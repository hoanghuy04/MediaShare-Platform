package com.hoanghuy04.instagrambackend.service.conversation;

import com.hoanghuy04.instagrambackend.constant.AppConstants;
import com.hoanghuy04.instagrambackend.dto.response.ConversationResponse;
import com.hoanghuy04.instagrambackend.dto.response.MediaFileResponse;
import com.hoanghuy04.instagrambackend.dto.response.MessageResponse;
import com.hoanghuy04.instagrambackend.entity.Message;
import com.hoanghuy04.instagrambackend.entity.User;
import com.hoanghuy04.instagrambackend.entity.Conversation;
import com.hoanghuy04.instagrambackend.entity.conversation.ConversationMember;
import com.hoanghuy04.instagrambackend.entity.conversation.LastMessageInfo;
import com.hoanghuy04.instagrambackend.enums.ConversationType;
import com.hoanghuy04.instagrambackend.enums.MemberRole;
import com.hoanghuy04.instagrambackend.exception.BadRequestException;
import com.hoanghuy04.instagrambackend.exception.ResourceNotFoundException;
import com.hoanghuy04.instagrambackend.mapper.MessageMapper;
import com.hoanghuy04.instagrambackend.repository.UserRepository;
import com.hoanghuy04.instagrambackend.repository.ConversationRepository;
import com.hoanghuy04.instagrambackend.service.FileService;
import com.hoanghuy04.instagrambackend.util.SecurityUtil;
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
    MessageMapper messageMapper;
    private final SecurityUtil securityUtil;

    // ===============================
    // Direct & Group conversation
    // ===============================
    @Transactional(readOnly = true)
    @Override
    public ConversationResponse getExistingDirectConversation(String userId1, String userId2) {
        String key = directKeyOf(userId1, userId2);
        Optional<Conversation> conversation = conversationRepository.findByTypeAndDirectKey(ConversationType.DIRECT, key);

        return conversation.map(messageMapper::toConversationDTO).orElse(null);
    }

    @Transactional
    @Override
    public ConversationResponse createDirectConversation(String userId1, String userId2) {
        if (Objects.equals(userId1, userId2)) {
            throw new BadRequestException("Cannot create conversation with yourself");
        }

        // build participants + key
        String key = directKeyOf(userId1, userId2);
//        List<String> sorted = Arrays.asList(userId1, userId2);
//        sorted.sort(String::compareTo);
        List<ConversationMember> members = createConversationMembers(Arrays.asList(userId1, userId2), userId1, MemberRole.MEMBER);

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
            Conversation conversation = conversationRepository.findByTypeAndDirectKey(ConversationType.DIRECT, key)
                    .orElseThrow(() -> new BadRequestException("Failed to create or fetch direct conversation"));
            return messageMapper.toConversationDTO(conversation);
        }
        log.info("Direct conversation ready: {}", result.getId());
        return messageMapper.toConversationDTO(result);
    }

    @Transactional
    @Override
    public String findOrCreateDirect(String userId, String peerId) {
        String key = directKeyOf(userId, peerId);
        List<ConversationMember> members = createConversationMembers(Arrays.asList(userId, peerId), userId, MemberRole.MEMBER);
        return conversationRepository.findByTypeAndDirectKey(ConversationType.DIRECT, key)
                .map(Conversation::getId)
                .orElseGet(() -> {
                    Conversation conv = Conversation.builder()
                            .type(ConversationType.DIRECT)
                            .directKey(key)
                            .participants(members)
                            .createdBy(userId)
                            .build();
                    return conversationRepository.save(conv).getId();
                });
    }


    @Transactional
    @Override
    public ConversationResponse createGroupConversation(String creatorId, List<String> participantIds, String groupName) {
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
                .avatar(AppConstants.DEFAULT_AVATAR_URL)
                .participants(members)
                .admins(Collections.singletonList(creatorId))
                .createdBy(creatorId)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        return messageMapper.toConversationDTO(conversationRepository.save(conversation));
    }

    // ===============================
    // Members management
    // ===============================
    @Transactional
    @Override
    public void addMember(String conversationId, String userId, String addedBy) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found with id: " + conversationId));

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
    public void removeMember(String conversationId, String userId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found with id: " + conversationId));

        if (conversation.getType() != ConversationType.GROUP) {
            throw new BadRequestException("Can only remove members from group conversations");
        }

        String removedBy = securityUtil.getCurrentUserId();
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
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found with id: " + conversationId));

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
    public ConversationResponse updateGroupInfo(String conversationId, String name, String avatar, String updatedByUserId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found with id: " + conversationId));

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
        return messageMapper.toConversationDTO(conversationRepository.save(conversation));
    }

    // ===============================
    // Misc
    // ===============================
    @Transactional(readOnly = true)
    @Override
    public List<ConversationResponse> getUserConversations(String userId) {
        return conversationRepository.findByParticipantsContainingAndDeletedByNotContaining(userId, userId)
                .stream()
                .map(c -> messageMapper.toConversationDTO(c))
                .collect(Collectors.toList());
    }

    @Transactional
    @Override
    public void updateLastMessage(String conversationId, MessageResponse message) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found with id: " + conversationId));

        String previewText = buildPreviewTextForMessage(message);
        
        LastMessageInfo lastMessage = LastMessageInfo.builder()
                .messageId(message.getId())
                .type(message.getType())
                .content(previewText)
                .senderId(message.getSender().getId())
                .timestamp(message.getCreatedAt())
                .build();
        conversation.setLastMessage(lastMessage);
        conversation.setUpdatedAt(LocalDateTime.now());
        conversationRepository.save(conversation);
    }
    
    /**
     * Build human-readable preview text for a message based on its type.
     */
    private String buildPreviewTextForMessage(MessageResponse message) {
        if (message == null || message.getType() == null) {
            return "[Message]";
        }
        
        return switch (message.getType()) {
            case TEXT -> message.getContent() != null ? message.getContent() : "";
            case IMAGE -> "Đã gửi một ảnh";
            case VIDEO -> "Đã gửi một video";
            case POST_SHARE -> "Đã chia sẻ một bài viết";
        };
    }

    @Transactional(readOnly = true)
    @Override
    public boolean isParticipant(String conversationId, String userId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found with id: " + conversationId));

        return conversation.getParticipants().stream().anyMatch(p -> p.getUserId().equals(userId));
    }

    @Transactional(readOnly = true)
    @Override
    public ConversationResponse getConversationById(String conversationId) {
        return conversationRepository.findById(conversationId)
                .stream().findFirst()
                .map(messageMapper::toConversationDTO)
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

    @Transactional
    @Override
    public void promoteMemberToAdmin(String conversationId, String userId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));

        if (conversation.getType() != ConversationType.GROUP) {
            throw new BadRequestException("Can only promote members in group conversations");
        }

        String promotedBy = securityUtil.getCurrentUserId();

        // Verify promoter is admin
        if (!conversation.getAdmins().contains(promotedBy)) {
            throw new BadRequestException("Only admins can promote members");
        }

        // Find target member
        ConversationMember member = conversation.getParticipants().stream()
                .filter(p -> p.getUserId().equals(userId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Member not found"));

        if (member.getRole() == MemberRole.ADMIN) {
            throw new BadRequestException("User is already an admin");
        }

        // Promote to admin
        member.setRole(MemberRole.ADMIN);
        if (!conversation.getAdmins().contains(userId)) {
            conversation.getAdmins().add(userId);
        }

        conversation.setUpdatedAt(LocalDateTime.now());
        conversationRepository.save(conversation);

        log.info("User {} promoted to admin in conversation {} by {}", userId, conversationId, promotedBy);
    }

    @Transactional
    @Override
    public void demoteAdminToMember(String conversationId, String userId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));

        if (conversation.getType() != ConversationType.GROUP) {
            throw new BadRequestException("Can only demote admins in group conversations");
        }

        String demotedBy = securityUtil.getCurrentUserId();

        // Verify demoter is admin
        if (!conversation.getAdmins().contains(demotedBy)) {
            throw new BadRequestException("Only admins can demote other admins");
        }

        // Find target admin
        ConversationMember admin = conversation.getParticipants().stream()
                .filter(p -> p.getUserId().equals(userId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found"));

        if (admin.getRole() != MemberRole.ADMIN) {
            throw new BadRequestException("User is not an admin");
        }

        // Prevent demoting the last admin
        long adminCount = conversation.getAdmins().size();
        if (adminCount <= 1) {
            throw new BadRequestException("Cannot demote the last admin. Promote another member first.");
        }

        // Demote to member
        admin.setRole(MemberRole.MEMBER);
        conversation.getAdmins().remove(userId);

        conversation.setUpdatedAt(LocalDateTime.now());
        conversationRepository.save(conversation);

        log.info("Admin {} demoted to member in conversation {} by {}", userId, conversationId, demotedBy);
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
