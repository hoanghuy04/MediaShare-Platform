package com.hoanghuy04.instagrambackend.controller;

import com.hoanghuy04.instagrambackend.dto.request.AddMemberRequest;
import com.hoanghuy04.instagrambackend.dto.request.CreateGroupRequest;
import com.hoanghuy04.instagrambackend.dto.request.SendMessageRequest;
import com.hoanghuy04.instagrambackend.dto.request.UpdateConversationRequest;
import com.hoanghuy04.instagrambackend.dto.response.ConversationDTO;
import com.hoanghuy04.instagrambackend.dto.response.InboxItemDTO;
import com.hoanghuy04.instagrambackend.dto.response.MessageDTO;
import com.hoanghuy04.instagrambackend.dto.response.ApiResponse;
import com.hoanghuy04.instagrambackend.dto.response.PageResponse;
import com.hoanghuy04.instagrambackend.entity.message.Conversation;
import com.hoanghuy04.instagrambackend.entity.message.Message;
import com.hoanghuy04.instagrambackend.mapper.MessageMapper;
import com.hoanghuy04.instagrambackend.service.message.*;
import com.hoanghuy04.instagrambackend.service.user.UserService;
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

    @GetMapping("/inbox")
    @Operation(summary = "Get inbox items (conversations + sent message requests)")
    public ResponseEntity<ApiResponse<PageResponse<InboxItemDTO>>> getInbox(
            @RequestParam String userId,
            @PageableDefault(sort = "updatedAt", direction = Sort.Direction.DESC) Pageable pageable) {
        log.info("Get inbox items request received for user: {} (page: {}, size: {})",
                userId, pageable.getPageNumber(), pageable.getPageSize());

        PageResponse<InboxItemDTO> pageResponse = conversationMessageService.getInboxItems(userId, pageable);
        return ResponseEntity.ok(ApiResponse.success("Inbox retrieved successfully", pageResponse));
    }

    @GetMapping("/{conversationId}")
    @Operation(summary = "Get conversation details")
    public ResponseEntity<ApiResponse<ConversationDTO>> getConversation(
            @PathVariable String conversationId,
            @RequestParam String userId) {
        log.info("Get conversation request received for conversation: {} by user: {}", conversationId, userId);

        ConversationDTO response = conversationMessageService.getConversationAsDTO(conversationId, userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{conversationId}/messages")
    @Operation(summary = "Get messages in a conversation")
    public ResponseEntity<ApiResponse<PageResponse<MessageDTO>>> getConversationMessages(
            @PathVariable String conversationId,
            @RequestParam String userId,
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        log.info("Get messages request received for conversation: {} by user: {}", conversationId, userId);

        PageResponse<MessageDTO> response = conversationMessageService.getConversationMessagesAsDTO(
                conversationId, userId, pageable
        );
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/group")
    @Operation(summary = "Create a new group conversation")
    public ResponseEntity<ApiResponse<ConversationDTO>> createGroup(
            @Valid @RequestBody CreateGroupRequest request,
            @RequestParam String creatorId) {
        log.info("Create group request received by user: {}, name: {}", creatorId, request.getGroupName());

        ConversationDTO response = conversationMessageService.createGroupAndConvertToDTO(
                creatorId,
                request.getParticipantIds(),
                request.getGroupName()
        );
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Group created successfully", response));
    }

    @PutMapping("/{conversationId}")
    @Operation(summary = "Update group conversation information")
    public ResponseEntity<ApiResponse<ConversationDTO>> updateGroupSimple(
            @PathVariable String conversationId,
            @Valid @RequestBody UpdateConversationRequest request,
            @RequestParam String userId) {

        // dùng service mới
        conversationService.updateGroupInfo(
                conversationId,
                request.getName(),
                request.getAvatar(), // null/blank không đổi; "__REMOVE__" để xóa
                userId
        );

        // build DTO + resolve URL
        ConversationDTO dto = conversationMessageService.getConversationAsDTO(conversationId, userId);
        return ResponseEntity.ok(ApiResponse.success("Group updated successfully", dto));
    }

    @PostMapping("/{conversationId}/members")
    @Operation(summary = "Add members to a group conversation")
    public ResponseEntity<ApiResponse<Void>> addMembers(
            @PathVariable String conversationId,
            @Valid @RequestBody AddMemberRequest request,
            @RequestParam String addedBy) {
        log.info("Add members request received for conversation: {} by user: {}", conversationId, addedBy);

        for (String userId : request.getUserIds()) {
            conversationService.addMember(conversationId, userId, addedBy);
        }
        return ResponseEntity.ok(ApiResponse.success("Members added successfully", null));
    }

    @DeleteMapping("/{conversationId}/members/{userId}")
    @Operation(summary = "Remove a member from a group conversation")
    public ResponseEntity<ApiResponse<Void>> removeMember(
            @PathVariable String conversationId,
            @PathVariable String userId,
            @RequestParam String removedBy) {
        log.info("Remove member request received for conversation: {}, member: {}, by user: {}",
                conversationId, userId, removedBy);

        conversationService.removeMember(conversationId, userId, removedBy);
        return ResponseEntity.ok(ApiResponse.success("Member removed successfully", null));
    }

    @PostMapping("/{conversationId}/leave")
    @Operation(summary = "Leave a group conversation")
    public ResponseEntity<ApiResponse<Void>> leaveGroup(
            @PathVariable String conversationId,
            @RequestParam String userId) {
        log.info("Leave group request received for conversation: {} by user: {}", conversationId, userId);

        conversationService.leaveGroup(conversationId, userId);
        return ResponseEntity.ok(ApiResponse.success("Left group successfully", null));
    }

    @PostMapping("/direct/messages")
    @Operation(summary = "Send a direct message to a user (auto-creates conversation)")
    public ResponseEntity<ApiResponse<MessageDTO>> sendDirectMessage(
            @Valid @RequestBody SendMessageRequest request,
            @RequestParam String senderId) {
        log.info("Send direct message from user {} to user {}", senderId, request.getReceiverId());

        if (request.getReceiverId() == null || request.getReceiverId().isBlank()) {
            throw new com.hoanghuy04.instagrambackend.exception.BadRequestException("receiverId is required for direct messages");
        }

        Message message = conversationMessageService.sendMessage(
                senderId,
                request.getReceiverId(),
                request.getContent(),
                request.getMediaUrl()
        );

        webSocketMessageService.pushMessage(message);

        MessageDTO dto = messageMapper.toMessageDTO(message);

        if (dto.getSender() == null) {
            log.warn("Sender is null in DTO for message {}, manually setting from UserService", message.getId());
            try {
                var sender = userService.getUserEntityById(senderId);
                dto.setSender(messageMapper.toUserSummaryDTO(sender));
                log.info("Manually set sender {} for message {}", senderId, message.getId());
            } catch (Exception e) {
                log.error("Failed to manually set sender for message {}: {}", message.getId(), e.getMessage());
            }
        }

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Message sent successfully", dto));
    }

    @PostMapping("/{conversationId}/messages")
    @Operation(summary = "Send a message to a conversation")
    public ResponseEntity<ApiResponse<MessageDTO>> sendMessage(
            @PathVariable String conversationId,
            @Valid @RequestBody SendMessageRequest request,
            @RequestParam String senderId) {
        log.info("Send message to conversation {} by user {}", conversationId, senderId);

        Message message;
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
                    request.getContent(),
                    request.getMediaUrl()
            );
        }

        webSocketMessageService.pushMessage(message);

        MessageDTO dto = messageMapper.toMessageDTO(message);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Message sent successfully", dto));
    }

    @PostMapping("/messages/{messageId}/read")
    @Operation(summary = "Mark message as read (marks all in conversation)")
    public ResponseEntity<ApiResponse<Void>> markMessageAsRead(
            @PathVariable String messageId,
            @RequestParam String userId) {
        log.info("Mark message {} as read by user {}", messageId, userId);

        conversationMessageService.markAsRead(messageId, userId);
        return ResponseEntity.ok(ApiResponse.success("Message marked as read", null));
    }

    @DeleteMapping("/messages/{messageId}")
    @Operation(summary = "Delete a message for user (soft delete)")
    public ResponseEntity<ApiResponse<Void>> deleteMessage(
            @PathVariable String messageId,
            @RequestParam String userId) {
        log.info("Delete message {} for user {}", messageId, userId);

        conversationMessageService.deleteMessageForUser(messageId, userId);
        return ResponseEntity.ok(ApiResponse.success("Message deleted successfully", null));
    }

    @DeleteMapping("/{conversationId}")
    @Operation(summary = "Delete a conversation for a user (soft delete)")
    public ResponseEntity<ApiResponse<Void>> deleteConversation(
            @PathVariable String conversationId,
            @RequestParam String userId) {
        log.info("Delete conversation request received for conversation: {} by user: {}", conversationId, userId);

        conversationMessageService.deleteConversationForUser(conversationId, userId);
        return ResponseEntity.ok(ApiResponse.success("Conversation deleted successfully", null));
    }
}
