package com.hoanghuy04.instagrambackend.service.message;

import com.hoanghuy04.instagrambackend.entity.Message;
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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Service class for conversation operations.
 * Handles conversation management, member management, and group operations.
 * 
 * @author Instagram Backend Team
 * @version 2.0.0
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ConversationServiceImpl implements ConversationService {
    
    private final ConversationRepository conversationRepository;
    private final UserRepository userRepository;
    
    @Transactional(readOnly = true)
    @Override
    public Optional<Conversation> getExistingDirectConversation(String userId1, String userId2) {
        List<String> normalized = normalizeParticipants(userId1, userId2);
        Optional<Conversation> conversation = conversationRepository.findByTypeAndParticipantsNormalized(
            ConversationType.DIRECT, normalized
        );
        if (conversation.isPresent()) {
            return conversation;
        }

        // Fallback for legacy records without participantsNormalized populated
        return conversationRepository.findByTypeAndParticipants(
            ConversationType.DIRECT,
            normalized,
            2
        );
    }

    @Transactional
    @Override
    public Conversation createDirectConversation(String userId1, String userId2) {
        log.info("Creating direct conversation between {} and {}", userId1, userId2);

        List<String> normalized = normalizeParticipants(userId1, userId2);
        List<ConversationMember> participantMembers = createConversationMembers(normalized, userId1, MemberRole.MEMBER);

        Conversation conversation = Conversation.builder()
            .type(ConversationType.DIRECT)
            .participants(participantMembers)
            .participantsNormalized(new ArrayList<>(normalized))
            .createdBy(userId1)
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();

        try {
            conversation = conversationRepository.insert(conversation);
            log.info("Created new direct conversation: {}", conversation.getId());
            return conversation;
        } catch (DuplicateKeyException ex) {
            log.warn("Duplicate direct conversation detected for participants {}. Re-reading existing conversation", normalized);
            return conversationRepository.findByTypeAndParticipantsNormalized(
                ConversationType.DIRECT, normalized
            ).orElseThrow(() -> new BadRequestException("Failed to create conversation after duplicate key"));
        }
    }
    
    @Transactional
    @Override
    public Conversation createGroupConversation(
            String creatorId,
            List<String> participantIds,
            String groupName,
            String avatar
    ) {
        log.info("Creating group conversation: {} by user {}", groupName, creatorId);
        
        if (groupName == null || groupName.trim().isEmpty()) {
            throw new BadRequestException("Group name is required");
        }
        
        // Add creator to participants if not already included
        List<String> allParticipants = new ArrayList<>(participantIds);
        if (!allParticipants.contains(creatorId)) {
            allParticipants.add(creatorId);
        }
        
        if (allParticipants.size() < 2) {
            throw new BadRequestException("Group must have at least 2 participants");
        }
        
        // Create conversation with participant details
        List<ConversationMember> participantMembers = createConversationMembers(allParticipants, creatorId, null);
        
        Conversation conversation = Conversation.builder()
            .type(ConversationType.GROUP)
            .name(groupName)
            .avatar(avatar)
            .participants(participantMembers)
            .admins(Collections.singletonList(creatorId))
            .createdBy(creatorId)
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();
        
        conversation = conversationRepository.save(conversation);
        log.info("Created new group conversation: {} with {} members", conversation.getId(), allParticipants.size());
        
        return conversation;
    }
    
    @Transactional
    @Override
    public void addMember(String conversationId, String userId, String addedBy) {
        log.info("Adding member {} to conversation {} by {}", userId, conversationId, addedBy);
        
        Conversation conversation = getConversationById(conversationId);
        
        // Check if conversation is a group
        if (conversation.getType() != ConversationType.GROUP) {
            throw new BadRequestException("Can only add members to group conversations");
        }
        
        // Check if user has permission
        if (!conversation.getAdmins().contains(addedBy)) {
            throw new BadRequestException("Only admins can add members");
        }
        
        // Check if user is already a participant
        boolean isAlreadyMember = conversation.getParticipants().stream()
            .anyMatch(p -> p.getUserId().equals(userId));
        if (isAlreadyMember) {
            throw new BadRequestException("User is already a member");
        }
        
        // Fetch user info and create new member
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
        
        log.info("Member added successfully");
    }
    
    @Transactional
    @Override
    public void removeMember(String conversationId, String userId, String removedBy) {
        log.info("Removing member {} from conversation {} by {}", userId, conversationId, removedBy);
        
        Conversation conversation = getConversationById(conversationId);
        
        // Check if conversation is a group
        if (conversation.getType() != ConversationType.GROUP) {
            throw new BadRequestException("Can only remove members from group conversations");
        }
        
        // Check if user has permission
        if (!conversation.getAdmins().contains(removedBy)) {
            throw new BadRequestException("Only admins can remove members");
        }
        
        // Cannot remove yourself
        if (userId.equals(removedBy)) {
            throw new BadRequestException("Use leave group to remove yourself");
        }
        
        // Find and move member to left members
        conversation.getParticipants().stream()
            .filter(m -> m.getUserId().equals(userId) && m.getLeftAt() == null)
            .findFirst()
            .ifPresent(member -> {
                member.setLeftAt(LocalDateTime.now());
                conversation.getLeftMembers().add(member);
            });
        
        // Remove from participants
        conversation.getParticipants().removeIf(m -> m.getUserId().equals(userId));
        
        conversation.setUpdatedAt(LocalDateTime.now());
        conversationRepository.save(conversation);
        
        log.info("Member removed successfully");
    }
    
    @Transactional
    @Override
    public void leaveGroup(String conversationId, String userId) {
        log.info("User {} leaving group conversation {}", userId, conversationId);
        
        Conversation conversation = getConversationById(conversationId);
        
        // Check if user is a member
        boolean isMember = conversation.getParticipants().stream()
            .anyMatch(p -> p.getUserId().equals(userId));
        if (!isMember) {
            throw new BadRequestException("You are not a member of this conversation");
        }
        
        // Cannot leave direct conversation
        if (conversation.getType() == ConversationType.DIRECT) {
            throw new BadRequestException("Cannot leave a direct conversation");
        }
        
        // If user is the last admin, promote another member to admin
        if (conversation.getAdmins().contains(userId) && conversation.getAdmins().size() == 1) {
            List<String> regularMemberIds = conversation.getParticipants().stream()
                .map(ConversationMember::getUserId)
                .filter(id -> !id.equals(userId))
                .collect(Collectors.toList());
            
            if (!regularMemberIds.isEmpty()) {
                // Promote first regular member to admin
                String newAdminId = regularMemberIds.get(0);
                conversation.setAdmins(Collections.singletonList(newAdminId));
                
                // Update member role
                conversation.getParticipants().stream()
                    .filter(m -> m.getUserId().equals(newAdminId))
                    .findFirst()
                    .ifPresent(m -> m.setRole(MemberRole.ADMIN));
            }
        }
        
        // Remove admin status if applicable
        conversation.getAdmins().remove(userId);
        
        // Find and move member to left members
        conversation.getParticipants().stream()
            .filter(m -> m.getUserId().equals(userId) && m.getLeftAt() == null)
            .findFirst()
            .ifPresent(member -> {
                member.setLeftAt(LocalDateTime.now());
                conversation.getLeftMembers().add(member);
            });
        
        // Remove from participants
        conversation.getParticipants().removeIf(m -> m.getUserId().equals(userId));
        
        conversation.setUpdatedAt(LocalDateTime.now());
        conversationRepository.save(conversation);
        
        log.info("User left successfully");
    }
    
    @Transactional
    @Override
    public Conversation updateGroupInfo(String conversationId, String name, String avatar) {
        log.info("Updating group info for conversation {}", conversationId);
        
        Conversation conversation = getConversationById(conversationId);
        
        if (conversation.getType() != ConversationType.GROUP) {
            throw new BadRequestException("Can only update group conversations");
        }
        
        if (name != null && !name.trim().isEmpty()) {
            conversation.setName(name);
        }
        
        if (avatar != null) {
            conversation.setAvatar(avatar);
        }
        
        conversation.setUpdatedAt(LocalDateTime.now());
        conversation = conversationRepository.save(conversation);
        
        log.info("Group info updated successfully");
        return conversation;
    }
    
    @Transactional(readOnly = true)
    @Override
    public List<Conversation> getUserConversations(String userId) {
        log.debug("Getting conversations for user: {}", userId);

        List<Conversation> conversations = conversationRepository.findByParticipantsContainingAndDeletedByNotContaining(userId, userId);
        return conversations;
    }
    
    @Transactional
    @Override
    public void updateLastMessage(String conversationId, Message message) {
        log.debug("Updating last message for conversation {}", conversationId);
        
        Conversation conversation = getConversationById(conversationId);
        
        LastMessageInfo lastMessage = LastMessageInfo.builder()
            .messageId(message.getId())
            .content(message.getContent() != null ? message.getContent() : "[Media]")
            .senderId(message.getSender().getId())
            .timestamp(message.getCreatedAt())
            .build();
        
        ensureParticipantsNormalized(conversation);
        conversation.setLastMessage(lastMessage);
        conversation.setUpdatedAt(LocalDateTime.now());
        conversationRepository.save(conversation);
    }
    
    @Transactional(readOnly = true)
    @Override
    public boolean isParticipant(String conversationId, String userId) {
        Conversation conversation = getConversationById(conversationId);
        return conversation.getParticipants().stream()
            .anyMatch(p -> p.getUserId().equals(userId));
    }
    
    @Transactional(readOnly = true)
    @Override
    public Conversation getConversationById(String conversationId) {
        return conversationRepository.findById(conversationId)
            .orElseThrow(() -> new ResourceNotFoundException("Conversation not found with id: " + conversationId));
    }
    
    private List<String> normalizeParticipants(String userId1, String userId2) {
        if (userId1 == null || userId2 == null) {
            throw new BadRequestException("Participant IDs cannot be null");
        }
        if (userId1.equals(userId2)) {
            throw new BadRequestException("Cannot create conversation with yourself");
        }
        List<String> participants = new ArrayList<>();
        participants.add(userId1);
        participants.add(userId2);
        participants.sort(String::compareTo);
        return participants;
    }

    private void ensureParticipantsNormalized(Conversation conversation) {
        if (conversation.getType() != ConversationType.DIRECT) {
            return;
        }
        List<String> normalized = conversation.getParticipantsNormalized();
        if (normalized != null && normalized.size() == 2) {
            return;
        }
        List<String> participantIds = conversation.getParticipants().stream()
            .map(ConversationMember::getUserId)
            .collect(Collectors.toList());
        if (participantIds.size() == 2) {
            participantIds.sort(String::compareTo);
            conversation.setParticipantsNormalized(participantIds);
        }
    }

    /**
     * Create conversation members list with user details.
     * 
     * @param userIds list of user IDs to add
     * @param creatorId creator of the conversation (will be ADMIN if role is null)
     * @param defaultRole default role for all members (if null, creator becomes ADMIN, others MEMBER)
     * @return list of ConversationMember with populated user info
     */
    private List<ConversationMember> createConversationMembers(List<String> userIds, String creatorId, MemberRole defaultRole) {
        List<ConversationMember> members = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();
        
        for (String userId : userIds) {
            // Fetch user info
            User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
            
            // Determine role
            MemberRole role = defaultRole;
            if (role == null) {
                role = userId.equals(creatorId) ? MemberRole.ADMIN : MemberRole.MEMBER;
            }
            
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

