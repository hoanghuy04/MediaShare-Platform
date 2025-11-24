package com.hoanghuy04.instagrambackend.controller;

import com.hoanghuy04.instagrambackend.dto.request.AddMemberRequest;
import com.hoanghuy04.instagrambackend.dto.request.CreateGroupRequest;
import com.hoanghuy04.instagrambackend.dto.request.SendMessageRequest;
import com.hoanghuy04.instagrambackend.dto.request.UpdateConversationRequest;
import com.hoanghuy04.instagrambackend.dto.response.ConversationResponse;
import com.hoanghuy04.instagrambackend.dto.response.InboxItemResponse;
import com.hoanghuy04.instagrambackend.dto.response.MessageResponse;
import com.hoanghuy04.instagrambackend.dto.response.ApiResponse;
import com.hoanghuy04.instagrambackend.dto.response.PageResponse;
import com.hoanghuy04.instagrambackend.entity.Conversation;
import com.hoanghuy04.instagrambackend.entity.Message;
import com.hoanghuy04.instagrambackend.enums.ConversationType;
import com.hoanghuy04.instagrambackend.mapper.MessageMapper;
import com.hoanghuy04.instagrambackend.repository.ConversationRepository;
import com.hoanghuy04.instagrambackend.service.conversation.ConversationMessageService;
import com.hoanghuy04.instagrambackend.service.conversation.ConversationService;
import com.hoanghuy04.instagrambackend.service.websocket.*;
import com.hoanghuy04.instagrambackend.service.user.UserService;
import com.hoanghuy04.instagrambackend.util.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * REST controller for conversation management endpoints.
 * Handles both direct and group conversations.
 *
 * @author Instagram Backend Team
 * @version 2.0.0
 */
@Slf4j
@RestController
@RequestMapping("/conversations")
@RequiredArgsConstructor
@Tag(name = "Conversations", description = "Conversation management APIs")
@SecurityRequirement(name = "Bearer Authentication")
public class ConversationController {

    private final ConversationService conversationService;
    private final ConversationMessageService conversationMessageService;
    private final WebSocketMessageService webSocketMessageService;
    private final MessageMapper messageMapper;
    private final UserService userService;
    private final ConversationRepository conversationRepository;
    private final SecurityUtil securityUtil;

    @GetMapping("/inbox")
    @Operation(summary = "Get inbox items (conversations + sent message requests)")
    public ResponseEntity<ApiResponse<PageResponse<InboxItemResponse>>> getInbox(
            @PageableDefault(sort = "updatedAt", direction = Sort.Direction.DESC) Pageable pageable) {
        String userId = securityUtil.getCurrentUserId();
        log.info("Get inbox items request received for user: {} (page: {}, size: {})",
                userId, pageable.getPageNumber(), pageable.getPageSize());

        PageResponse<InboxItemResponse> pageResponse = conversationMessageService.getInboxItems(userId, pageable);
        return ResponseEntity.ok(ApiResponse.success("Inbox retrieved successfully", pageResponse));
    }

    @GetMapping("/{conversationId}")
    @Operation(summary = "Get conversation details")
    public ResponseEntity<ApiResponse<ConversationResponse>> getConversation(
            @PathVariable String conversationId) {
        String userId = securityUtil.getCurrentUserId();
        log.info("Get conversation request received for conversation: {} by user: {}", conversationId, userId);

        ConversationResponse response = conversationMessageService.getConversationAsDTO(conversationId, userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{conversationId}/messages")
    @Operation(summary = "Get messages in a conversation")
    public ResponseEntity<ApiResponse<PageResponse<MessageResponse>>> getConversationMessages(
            @PathVariable String conversationId,
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        String userId = securityUtil.getCurrentUserId();
        log.info("Get messages request received for conversation: {} by user: {}", conversationId, userId);

        PageResponse<MessageResponse> response = conversationMessageService.getConversationMessagesAsDTO(
                conversationId, userId, pageable
        );
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/direct/by-user/{peerId}")
    @Operation(summary = "Resolve DIRECT conversation by peer; 200 nếu có, 404 nếu chưa")
    public ResponseEntity<ApiResponse<String>> resolveDirect(
            @PathVariable String peerId) {
        String userId = securityUtil.getCurrentUserId();
        String key = conversationService.directKeyOf(userId, peerId);
        Conversation found = conversationRepository.findByTypeAndDirectKey(ConversationType.DIRECT, key).orElse(null);
        return ResponseEntity.ok(ApiResponse.success(found != null ? found.getId() : null));
    }

    @PostMapping("/group")
    @Operation(summary = "Create a new group conversation")
    public ResponseEntity<ApiResponse<ConversationResponse>> createGroup(
            @Valid @RequestBody CreateGroupRequest request) {
        String creatorId = securityUtil.getCurrentUserId();
        log.info("Create group request received by user: {}, name: {}", creatorId, request.getGroupName());

        ConversationResponse response = conversationMessageService.createGroupAndConvertToDTO(
                creatorId,
                request.getParticipantIds(),
                request.getGroupName()
        );
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Group created successfully", response));
    }

    @PutMapping("/{conversationId}")
    @Operation(summary = "Update group conversation information")
    public ResponseEntity<ApiResponse<ConversationResponse>> updateGroupSimple(
            @PathVariable String conversationId,
            @Valid @RequestBody UpdateConversationRequest request) {
        String userId = securityUtil.getCurrentUserId();

        // dùng service mới
        conversationService.updateGroupInfo(
                conversationId,
                request.getName(),
                request.getAvatar(), // null/blank không đổi; "__REMOVE__" để xóa
                userId
        );

        // build DTO + resolve URL
        ConversationResponse dto = conversationMessageService.getConversationAsDTO(conversationId, userId);
        
        // Notify all participants about the update
        List<String> participantIds = dto.getParticipants().stream()
                .map(p -> p.getUserId())
                .collect(Collectors.toList());
        webSocketMessageService.pushConversationUpdate(
                conversationId,
                participantIds,
                "GROUP_INFO_UPDATED",
                dto
        );
        
        return ResponseEntity.ok(ApiResponse.success("Group updated successfully", dto));
    }

    @PostMapping("/{conversationId}/members")
    @Operation(summary = "Add members to a group conversation")
    public ResponseEntity<ApiResponse<Void>> addMembers(
            @PathVariable String conversationId,
            @Valid @RequestBody AddMemberRequest request) {
        String addedBy = securityUtil.getCurrentUserId();
        log.info("Add members request received for conversation: {} by user: {}", conversationId, addedBy);

        for (String userId : request.getUserIds()) {
            conversationService.addMember(conversationId, userId, addedBy);
        }
        
        // Notify all participants including new members
        ConversationResponse dto = conversationMessageService.getConversationAsDTO(conversationId, addedBy);
        List<String> participantIds = dto.getParticipants().stream()
                .map(p -> p.getUserId())
                .collect(Collectors.toList());
        java.util.Map<String, Object> data = new java.util.HashMap<>();
        data.put("addedUserIds", request.getUserIds());
        data.put("addedBy", addedBy);
        data.put("conversation", dto);
        webSocketMessageService.pushConversationUpdate(
                conversationId,
                participantIds,
                "MEMBERS_ADDED",
                data
        );
        
        return ResponseEntity.ok(ApiResponse.success("Members added successfully", null));
    }

    @DeleteMapping("/{conversationId}/members/{userId}")
    @Operation(summary = "Remove a member from a group conversation")
    public ResponseEntity<ApiResponse<Void>> removeMember(
            @PathVariable String conversationId,
            @PathVariable String userId) {
        String removedBy = securityUtil.getCurrentUserId();
        log.info("Remove member request received for conversation: {}, member: {}, removed by: {}",
                conversationId, userId, removedBy);

        conversationService.removeMember(conversationId, userId);
        
        // Notify all remaining participants + the removed user
        ConversationResponse dto = conversationMessageService.getConversationAsDTO(conversationId, removedBy);
        java.util.List<String> participantIds = new java.util.ArrayList<>(dto.getParticipants().stream()
                .map(p -> p.getUserId())
                .collect(java.util.stream.Collectors.toList()));
        participantIds.add(userId); // Also notify the removed user
        java.util.Map<String, Object> data = new java.util.HashMap<>();
        data.put("removedUserId", userId);
        data.put("removedBy", removedBy);
        data.put("conversation", dto);
        webSocketMessageService.pushConversationUpdate(
                conversationId,
                participantIds,
                "MEMBER_REMOVED",
                data
        );
        
        return ResponseEntity.ok(ApiResponse.success("Member removed successfully", null));
    }

    @PostMapping("/{conversationId}/leave")
    @Operation(summary = "Leave a group conversation")
    public ResponseEntity<ApiResponse<Void>> leaveGroup(
            @PathVariable String conversationId) {
        String userId = securityUtil.getCurrentUserId();
        log.info("Leave group request received for conversation: {} by user: {}", conversationId, userId);

        conversationService.leaveGroup(conversationId, userId);
        return ResponseEntity.ok(ApiResponse.success("Left group successfully", null));
    }

    @PostMapping("/{conversationId}/members/{userId}/promote")
    @Operation(summary = "Promote a member to admin")
    public ResponseEntity<ApiResponse<Void>> promoteMemberToAdmin(
            @PathVariable String conversationId,
            @PathVariable String userId) {
        String promotedBy = securityUtil.getCurrentUserId();
        log.info("Promote member {} to admin in conversation {} by user {}", userId, conversationId, promotedBy);

        conversationService.promoteMemberToAdmin(conversationId, userId);
        
        // Notify all participants
        ConversationResponse dto = conversationMessageService.getConversationAsDTO(conversationId, promotedBy);
        java.util.List<String> participantIds = dto.getParticipants().stream()
                .map(p -> p.getUserId())
                .collect(java.util.stream.Collectors.toList());
        java.util.Map<String, Object> data = new java.util.HashMap<>();
        data.put("promotedUserId", userId);
        data.put("promotedBy", promotedBy);
        data.put("conversation", dto);
        webSocketMessageService.pushConversationUpdate(
                conversationId,
                participantIds,
                "MEMBER_PROMOTED",
                data
        );
        
        return ResponseEntity.ok(ApiResponse.success("Member promoted to admin successfully", null));
    }

    @PostMapping("/{conversationId}/members/{userId}/demote")
    @Operation(summary = "Demote an admin to member")
    public ResponseEntity<ApiResponse<Void>> demoteAdminToMember(
            @PathVariable String conversationId,
            @PathVariable String userId) {
        String demotedBy = securityUtil.getCurrentUserId();
        log.info("Demote admin {} to member in conversation {} by user {}", userId, conversationId, demotedBy);

        conversationService.demoteAdminToMember(conversationId, userId);
        
        // Notify all participants
        ConversationResponse dto = conversationMessageService.getConversationAsDTO(conversationId, demotedBy);
        java.util.List<String> participantIds = dto.getParticipants().stream()
                .map(p -> p.getUserId())
                .collect(java.util.stream.Collectors.toList());
        java.util.Map<String, Object> data = new java.util.HashMap<>();
        data.put("demotedUserId", userId);
        data.put("demotedBy", demotedBy);
        data.put("conversation", dto);
        webSocketMessageService.pushConversationUpdate(
                conversationId,
                participantIds,
                "MEMBER_DEMOTED",
                data
        );
        
        return ResponseEntity.ok(ApiResponse.success("Admin demoted to member successfully", null));
    }

    @PostMapping("/direct/messages")
    @Operation(summary = "Send a direct message to a user (auto-creates conversation)")
    public ResponseEntity<ApiResponse<MessageResponse>> sendDirectMessage(
            @Valid @RequestBody SendMessageRequest request) {
        String senderId = securityUtil.getCurrentUserId();
        log.info("Send direct message from user {} to user {}", senderId, request.getReceiverId());

        if (request.getReceiverId() == null || request.getReceiverId().isBlank()) {
            throw new com.hoanghuy04.instagrambackend.exception.BadRequestException("receiverId is required for direct messages");
        }

        MessageResponse message = conversationMessageService.sendMessage(
                senderId,
                request.getReceiverId(),
                request.getType(),
                request.getContent()
        );

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Message sent successfully", message));
    }

    @PostMapping("/{conversationId}/messages")
    @Operation(summary = "Send a message to a conversation")
    public ResponseEntity<ApiResponse<MessageResponse>> sendMessage(
            @PathVariable String conversationId,
            @Valid @RequestBody SendMessageRequest request) {
        String senderId = securityUtil.getCurrentUserId();
        log.info("Send message to conversation {} by user {}", conversationId, senderId);

        MessageResponse message;
        if (request.getReplyToMessageId() != null && !request.getReplyToMessageId().isBlank()) {
            message = conversationMessageService.replyToMessage(
                    conversationId,
                    senderId,
                    request.getReplyToMessageId(),
                    request.getContent()
            );
        } else {
            message = conversationMessageService.sendMessageToConversation(
                    conversationId,
                    senderId,
                    request.getType(),
                    request.getContent()
            );
        }

        webSocketMessageService.pushMessage(message);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Message sent successfully", message));
    }

    @PostMapping("/messages/{messageId}/read")
    @Operation(summary = "Mark message as read (marks all in conversation)")
    public ResponseEntity<ApiResponse<Void>> markMessageAsRead(
            @PathVariable String messageId) {
        conversationMessageService.markAsRead(messageId);
        return ResponseEntity.ok(ApiResponse.success("Message marked as read", null));
    }

    @DeleteMapping("/messages/{messageId}")
    @Operation(summary = "Delete a message for user (soft delete)")
    public ResponseEntity<ApiResponse<Void>> deleteMessage(
            @PathVariable String messageId) {
        String userId = securityUtil.getCurrentUserId();
        log.info("Delete message {} for user {}", messageId, userId);

        conversationMessageService.deleteMessageForUser(messageId, userId);
        return ResponseEntity.ok(ApiResponse.success("Message deleted successfully", null));
    }

    @DeleteMapping("/{conversationId}")
    @Operation(summary = "Delete a conversation for a user (soft delete)")
    public ResponseEntity<ApiResponse<Void>> deleteConversation(
            @PathVariable String conversationId) {
        String userId = securityUtil.getCurrentUserId();
        log.info("Delete conversation request received for conversation: {} by user: {}", conversationId, userId);

        conversationMessageService.deleteConversationForUser(conversationId, userId);
        return ResponseEntity.ok(ApiResponse.success("Conversation deleted successfully", null));
    }
}
