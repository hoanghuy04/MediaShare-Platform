package com.hoanghuy04.instagrambackend.service.message;

import com.hoanghuy04.instagrambackend.entity.Message;
import com.hoanghuy04.instagrambackend.entity.message.Conversation;
import com.hoanghuy04.instagrambackend.entity.message.ConversationMember;
import com.hoanghuy04.instagrambackend.entity.message.LastMessageInfo;
import com.hoanghuy04.instagrambackend.enums.ConversationType;
import com.hoanghuy04.instagrambackend.enums.MemberRole;
import com.hoanghuy04.instagrambackend.exception.BadRequestException;
import com.hoanghuy04.instagrambackend.exception.ResourceNotFoundException;
import com.hoanghuy04.instagrambackend.repository.message.ConversationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
public class ConversationService {
    
    private final ConversationRepository conversationRepository;
    
    /**
     * Get or create a direct conversation between two users.
     *
     * @param userId1 first user ID
     * @param userId2 second user ID
     * @return Conversation entity
     */
    @Transactional
    public Conversation getOrCreateDirectConversation(String userId1, String userId2) {
        log.info("Getting or creating direct conversation between {} and {}", userId1, userId2);
        
        if (userId1.equals(userId2)) {
            throw new BadRequestException("Cannot create conversation with yourself");
        }
        
        // Create sorted participant list for consistent lookup
        List<String> participants = new ArrayList<>();
        participants.add(userId1);
        participants.add(userId2);
        Collections.sort(participants);
        
        // Try to find existing conversation
        Optional<Conversation> existing = conversationRepository.findByTypeAndParticipants(
            ConversationType.DIRECT, 
            participants, 
            2
        );
        
        if (existing.isPresent()) {
            log.debug("Found existing direct conversation: {}", existing.get().getId());
            return existing.get();
        }
        
        // Create new conversation
        Conversation conversation = Conversation.builder()
            .type(ConversationType.DIRECT)
            .participants(participants)
            .createdBy(userId1)
            .members(createInitialMembers(participants, userId1))
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();
        
        conversation = conversationRepository.save(conversation);
        log.info("Created new direct conversation: {}", conversation.getId());
        
        return conversation;
    }
    
    /**
     * Create a group conversation.
     *
     * @param creatorId the user ID who creates the group
     * @param participantIds list of participant user IDs
     * @param groupName the name of the group
     * @param avatar the avatar URL of the group
     * @return Conversation entity
     */
    @Transactional
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
        
        // Create conversation
        Conversation conversation = Conversation.builder()
            .type(ConversationType.GROUP)
            .name(groupName)
            .avatar(avatar)
            .participants(allParticipants)
            .admins(Collections.singletonList(creatorId))
            .createdBy(creatorId)
            .members(createGroupMembers(allParticipants, creatorId))
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();
        
        conversation = conversationRepository.save(conversation);
        log.info("Created new group conversation: {} with {} members", conversation.getId(), allParticipants.size());
        
        return conversation;
    }
    
    /**
     * Add member to a group conversation.
     *
     * @param conversationId the conversation ID
     * @param userId the user ID to add
     * @param addedBy the user ID who adds the member
     */
    @Transactional
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
        if (conversation.getParticipants().contains(userId)) {
            throw new BadRequestException("User is already a member");
        }
        
        // Add to participants
        conversation.getParticipants().add(userId);
        
        // Add to members
        ConversationMember member = ConversationMember.builder()
            .userId(userId)
            .joinedAt(LocalDateTime.now())
            .role(MemberRole.MEMBER)
            .build();
        conversation.getMembers().add(member);
        
        conversation.setUpdatedAt(LocalDateTime.now());
        conversationRepository.save(conversation);
        
        log.info("Member added successfully");
    }
    
    /**
     * Remove member from a group conversation.
     *
     * @param conversationId the conversation ID
     * @param userId the user ID to remove
     * @param removedBy the user ID who removes the member
     */
    @Transactional
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
        
        // Remove from participants
        conversation.getParticipants().remove(userId);
        
        // Move to left members
        conversation.getMembers().stream()
            .filter(m -> m.getUserId().equals(userId) && m.getLeftAt() == null)
            .findFirst()
            .ifPresent(member -> {
                member.setLeftAt(LocalDateTime.now());
                conversation.getLeftMembers().add(member);
            });
        
        conversation.getMembers().removeIf(m -> m.getUserId().equals(userId) && m.getLeftAt() == null);
        
        conversation.setUpdatedAt(LocalDateTime.now());
        conversationRepository.save(conversation);
        
        log.info("Member removed successfully");
    }
    
    /**
     * Leave a group conversation.
     *
     * @param conversationId the conversation ID
     * @param userId the user ID who leaves
     */
    @Transactional
    public void leaveGroup(String conversationId, String userId) {
        log.info("User {} leaving group conversation {}", userId, conversationId);
        
        Conversation conversation = getConversationById(conversationId);
        
        if (!conversation.getParticipants().contains(userId)) {
            throw new BadRequestException("You are not a member of this conversation");
        }
        
        // Cannot leave direct conversation
        if (conversation.getType() == ConversationType.DIRECT) {
            throw new BadRequestException("Cannot leave a direct conversation");
        }
        
        // If user is the last admin, promote another member to admin
        if (conversation.getAdmins().contains(userId) && conversation.getAdmins().size() == 1) {
            List<String> regularMembers = conversation.getParticipants().stream()
                .filter(p -> !p.equals(userId))
                .collect(Collectors.toList());
            
            if (!regularMembers.isEmpty()) {
                // Promote first regular member to admin
                String newAdminId = regularMembers.get(0);
                conversation.setAdmins(Collections.singletonList(newAdminId));
                
                // Update member role
                conversation.getMembers().stream()
                    .filter(m -> m.getUserId().equals(newAdminId))
                    .findFirst()
                    .ifPresent(m -> m.setRole(MemberRole.ADMIN));
            }
        }
        
        // Remove admin status if applicable
        conversation.getAdmins().remove(userId);
        
        // Remove from participants
        conversation.getParticipants().remove(userId);
        
        // Move to left members
        conversation.getMembers().stream()
            .filter(m -> m.getUserId().equals(userId) && m.getLeftAt() == null)
            .findFirst()
            .ifPresent(member -> {
                member.setLeftAt(LocalDateTime.now());
                conversation.getLeftMembers().add(member);
            });
        
        conversation.getMembers().removeIf(m -> m.getUserId().equals(userId) && m.getLeftAt() == null);
        
        conversation.setUpdatedAt(LocalDateTime.now());
        conversationRepository.save(conversation);
        
        log.info("User left successfully");
    }
    
    /**
     * Update group information.
     *
     * @param conversationId the conversation ID
     * @param name the new group name
     * @param avatar the new avatar URL
     * @return updated Conversation entity
     */
    @Transactional
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
    
    /**
     * Get all conversations for a user (excluding deleted conversations).
     *
     * @param userId the user ID
     * @return List of conversations
     */
    @Transactional(readOnly = true)
    public List<Conversation> getUserConversations(String userId) {
        log.debug("Getting conversations for user: {}", userId);
        
        return conversationRepository.findByParticipantsContainingAndDeletedByNotContaining(userId, userId);
    }
    
    /**
     * Update the last message in a conversation.
     *
     * @param conversationId the conversation ID
     * @param message the message to set as last message
     */
    @Transactional
    public void updateLastMessage(String conversationId, Message message) {
        log.debug("Updating last message for conversation {}", conversationId);
        
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
    
    /**
     * Check if a user is a participant in a conversation.
     *
     * @param conversationId the conversation ID
     * @param userId the user ID
     * @return true if user is participant, false otherwise
     */
    @Transactional(readOnly = true)
    public boolean isParticipant(String conversationId, String userId) {
        Conversation conversation = getConversationById(conversationId);
        return conversation.getParticipants().contains(userId);
    }
    
    /**
     * Get conversation by ID.
     *
     * @param conversationId the conversation ID
     * @return Conversation entity
     */
    @Transactional(readOnly = true)
    public Conversation getConversationById(String conversationId) {
        return conversationRepository.findById(conversationId)
            .orElseThrow(() -> new ResourceNotFoundException("Conversation not found with id: " + conversationId));
    }
    
    /**
     * Create initial members list for a direct conversation.
     */
    private List<ConversationMember> createInitialMembers(List<String> participants, String createdBy) {
        List<ConversationMember> members = new ArrayList<>();
        for (String userId : participants) {
            ConversationMember member = ConversationMember.builder()
                .userId(userId)
                .joinedAt(LocalDateTime.now())
                .role(MemberRole.MEMBER)
                .build();
            members.add(member);
        }
        return members;
    }
    
    /**
     * Create members list for a group conversation.
     */
    private List<ConversationMember> createGroupMembers(List<String> participants, String createdBy) {
        List<ConversationMember> members = new ArrayList<>();
        for (String userId : participants) {
            ConversationMember member = ConversationMember.builder()
                .userId(userId)
                .joinedAt(LocalDateTime.now())
                .role(userId.equals(createdBy) ? MemberRole.ADMIN : MemberRole.MEMBER)
                .build();
            members.add(member);
        }
        return members;
    }
}

