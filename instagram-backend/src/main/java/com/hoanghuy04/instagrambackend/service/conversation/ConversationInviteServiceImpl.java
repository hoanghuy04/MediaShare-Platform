package com.hoanghuy04.instagrambackend.service.conversation;

import com.hoanghuy04.instagrambackend.dto.request.CreateInviteLinkRequest;
import com.hoanghuy04.instagrambackend.dto.response.ConversationResponse;
import com.hoanghuy04.instagrambackend.dto.response.InviteLinkResponse;
import com.hoanghuy04.instagrambackend.entity.Conversation;
import com.hoanghuy04.instagrambackend.entity.User;
import com.hoanghuy04.instagrambackend.entity.ConversationInviteLink;
import com.hoanghuy04.instagrambackend.entity.conversation.ConversationMember;
import com.hoanghuy04.instagrambackend.enums.ConversationType;
import com.hoanghuy04.instagrambackend.enums.MemberRole;
import com.hoanghuy04.instagrambackend.exception.BadRequestException;
import com.hoanghuy04.instagrambackend.exception.ResourceNotFoundException;
import com.hoanghuy04.instagrambackend.mapper.InviteLinkMapper;
import com.hoanghuy04.instagrambackend.mapper.MessageMapper;
import com.hoanghuy04.instagrambackend.repository.ConversationInviteLinkRepository;
import com.hoanghuy04.instagrambackend.repository.ConversationRepository;
import com.hoanghuy04.instagrambackend.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ConversationInviteServiceImpl implements ConversationInviteService {

    final ConversationInviteLinkRepository inviteLinkRepository;
    final ConversationRepository conversationRepository;
    final UserRepository userRepository;
    final MessageMapper messageMapper;
    final InviteLinkMapper inviteLinkMapper;

    @Value("${app.base-url}")
    String baseUrl;

    @Override
    @Transactional
    public InviteLinkResponse createOrRotateInviteLink(String conversationId, String requesterId, CreateInviteLinkRequest request) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found with id: " + conversationId));

        // Validate conversation is GROUP
        if (conversation.getType() != ConversationType.GROUP) {
            throw new BadRequestException("Invite links are only available for group conversations");
        }

        // Validate requester is a member
        boolean isMember = conversation.getParticipants().stream()
                .anyMatch(p -> p.getUserId().equals(requesterId));
        if (!isMember) {
            throw new BadRequestException("You must be a member of the group to create invite links");
        }

        // Revoke all existing active links for this conversation
        List<ConversationInviteLink> activeLinks = inviteLinkRepository.findByConversationIdAndActiveTrue(conversationId);
        LocalDateTime now = LocalDateTime.now();
        for (ConversationInviteLink link : activeLinks) {
            link.setActive(false);
            link.setRevokedBy(requesterId);
            link.setRevokedAt(now);
        }
        inviteLinkRepository.saveAll(activeLinks);

        // Generate new token (URL-safe UUID)
        String token = UUID.randomUUID().toString().replace("-", "");

        // Create new invite link
        ConversationInviteLink newLink = ConversationInviteLink.builder()
                .conversationId(conversationId)
                .token(token)
                .createdBy(requesterId)
                .createdAt(now)
                .expiresAt(request.getExpiresAt())
                .maxUses(request.getMaxUses())
                .usedCount(0)
                .active(true)
                .build();

        ConversationInviteLink savedLink = inviteLinkRepository.save(newLink);

        return inviteLinkMapper.toInviteLinkResponse(savedLink);
    }

    @Override
    @Transactional(readOnly = true)
    public InviteLinkResponse getActiveInviteLink(String conversationId, String requesterId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found with id: " + conversationId));

        // Validate conversation is GROUP
        if (conversation.getType() != ConversationType.GROUP) {
            throw new BadRequestException("Invite links are only available for group conversations");
        }

        // Validate requester is a member
        boolean isMember = conversation.getParticipants().stream()
                .anyMatch(p -> p.getUserId().equals(requesterId));
        if (!isMember) {
            throw new BadRequestException("You must be a member of the group to view invite links");
        }

        // Find the most recent link (active or inactive)
        List<ConversationInviteLink> allLinks = inviteLinkRepository.findByConversationIdOrderByCreatedAtDesc(conversationId);
        if (allLinks.isEmpty()) {
            return null;
        }

        // Return the most recent one
        ConversationInviteLink link = allLinks.get(0);

        return inviteLinkMapper.toInviteLinkResponse(link);
    }

    @Override
    @Transactional
    public void revokeInviteLink(String conversationId, String requesterId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found with id: " + conversationId));

        // Validate conversation is GROUP
        if (conversation.getType() != ConversationType.GROUP) {
            throw new BadRequestException("Invite links are only available for group conversations");
        }

        // Validate requester is a member
        boolean isMember = conversation.getParticipants().stream()
                .anyMatch(p -> p.getUserId().equals(requesterId));
        if (!isMember) {
            throw new BadRequestException("You must be a member of the group to revoke invite links");
        }

        // Revoke all active links
        List<ConversationInviteLink> activeLinks = inviteLinkRepository.findByConversationIdAndActiveTrue(conversationId);
        LocalDateTime now = LocalDateTime.now();
        for (ConversationInviteLink link : activeLinks) {
            link.setActive(false);
            link.setRevokedBy(requesterId);
            link.setRevokedAt(now);
        }
        inviteLinkRepository.saveAll(activeLinks);

        log.info("Invite links revoked for conversation {} by {}", conversationId, requesterId);
    }

    @Override
    @Transactional
    public InviteLinkResponse updateInviteLinkActive(String conversationId, String requesterId, Boolean active) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found with id: " + conversationId));

        // Validate conversation is GROUP
        if (conversation.getType() != ConversationType.GROUP) {
            throw new BadRequestException("Invite links are only available for group conversations");
        }

        // Validate requester is a member
        boolean isMember = conversation.getParticipants().stream()
                .anyMatch(p -> p.getUserId().equals(requesterId));
        if (!isMember) {
            throw new BadRequestException("You must be a member of the group to update invite links");
        }

        // Find the most recent link
        List<ConversationInviteLink> allLinks = inviteLinkRepository.findByConversationIdOrderByCreatedAtDesc(conversationId);
        if (allLinks.isEmpty()) {
            throw new BadRequestException("No invite link found. Please create one first.");
        }

        ConversationInviteLink link = allLinks.get(0);
        link.setActive(active);
        
        if (!active) {
            // When disabling, set revoked info
            link.setRevokedBy(requesterId);
            link.setRevokedAt(LocalDateTime.now());
        } else {
            // When enabling, clear revoked info
            link.setRevokedBy(null);
            link.setRevokedAt(null);
        }

        ConversationInviteLink savedLink = inviteLinkRepository.save(link);

        return inviteLinkMapper.toInviteLinkResponse(savedLink);
    }

    @Override
    @Transactional
    public ConversationResponse joinByInviteToken(String token, String userId) {
        // Find active link by token
        ConversationInviteLink link = inviteLinkRepository.findByTokenAndActiveTrue(token)
                .orElseThrow(() -> new BadRequestException("Invalid or expired invite link"));

        // Validate link is still active
        if (!link.getActive()) {
            throw new BadRequestException("This invite link has been revoked");
        }

        // Validate expiration
        if (link.getExpiresAt() != null && link.getExpiresAt().isBefore(LocalDateTime.now())) {
            link.setActive(false);
            inviteLinkRepository.save(link);
            throw new BadRequestException("This invite link has expired");
        }

        // Validate max uses
        if (link.getMaxUses() != null && link.getUsedCount() >= link.getMaxUses()) {
            link.setActive(false);
            inviteLinkRepository.save(link);
            throw new BadRequestException("This invite link has reached its usage limit");
        }

        // Get conversation
        Conversation conversation = conversationRepository.findById(link.getConversationId())
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));

        // Validate conversation is GROUP
        if (conversation.getType() != ConversationType.GROUP) {
            throw new BadRequestException("Invalid conversation type");
        }

        // Check if user is already a member
        boolean isAlreadyMember = conversation.getParticipants().stream()
                .anyMatch(p -> p.getUserId().equals(userId));

        if (isAlreadyMember) {
            // User is already a member, just return the conversation
            log.info("User {} already a member of conversation {}, returning conversation", userId, conversation.getId());
            return messageMapper.toConversationDTO(conversation);
        }

        // Add user as member
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        ConversationMember newMember = ConversationMember.builder()
                .userId(userId)
                .username(user.getUsername())
                .avatar(user.getProfile() != null ? user.getProfile().getAvatar() : null)
                .isVerified(user.isVerified())
                .joinedAt(LocalDateTime.now())
                .role(MemberRole.MEMBER)
                .build();

        conversation.getParticipants().add(newMember);
        conversation.setUpdatedAt(LocalDateTime.now());
        conversationRepository.save(conversation);

        // Update link usage
        link.setUsedCount(link.getUsedCount() + 1);
        if (link.getMaxUses() != null && link.getUsedCount() >= link.getMaxUses()) {
            link.setActive(false);
        }
        inviteLinkRepository.save(link);

        log.info("User {} joined conversation {} via invite link", userId, conversation.getId());

        return messageMapper.toConversationDTO(conversation);
    }
}

