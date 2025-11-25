package com.hoanghuy04.instagrambackend.controller;

import com.hoanghuy04.instagrambackend.dto.request.CreateInviteLinkRequest;
import com.hoanghuy04.instagrambackend.dto.response.ConversationResponse;
import com.hoanghuy04.instagrambackend.dto.response.InviteLinkResponse;
import com.hoanghuy04.instagrambackend.dto.response.ApiResponse;
import com.hoanghuy04.instagrambackend.service.conversation.ConversationInviteService;
import com.hoanghuy04.instagrambackend.service.conversation.ConversationMessageService;
import com.hoanghuy04.instagrambackend.service.websocket.WebSocketMessageService;
import com.hoanghuy04.instagrambackend.util.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * REST controller for conversation invite link management endpoints.
 * Handles creation, retrieval, activation, and revocation of invite links.
 *
 * @author Instagram Backend Team
 * @version 2.0.0
 */
@Slf4j
@RestController
@RequestMapping("/conversations")
@RequiredArgsConstructor
@Tag(name = "Conversation Invite Links", description = "Invite link management APIs")
@SecurityRequirement(name = "Bearer Authentication")
public class ConversationInviteLinkController {

    private final ConversationInviteService conversationInviteService;
    private final ConversationMessageService conversationMessageService;
    private final WebSocketMessageService webSocketMessageService;
    private final SecurityUtil securityUtil;

    @PostMapping("/{conversationId}/invite-link")
    @Operation(summary = "Create or rotate invite link for a group conversation")
    public ResponseEntity<ApiResponse<InviteLinkResponse>> createOrRotateInviteLink(
            @PathVariable String conversationId,
            @Valid @RequestBody(required = false) CreateInviteLinkRequest request) {
        String requesterId = securityUtil.getCurrentUserId();
        log.info("Create/rotate invite link request for conversation: {} by user: {}", conversationId, requesterId);

        if (request == null) {
            request = new CreateInviteLinkRequest();
        }

        InviteLinkResponse response = conversationInviteService.createOrRotateInviteLink(
                conversationId, requesterId, request);

        // Notify all participants about the new invite link
        ConversationResponse dto = conversationMessageService.getConversationAsDTO(conversationId, requesterId);
        List<String> participantIds = dto.getParticipants().stream()
                .map(p -> p.getUserId())
                .collect(Collectors.toList());
        Map<String, Object> data = new java.util.HashMap<>();
        data.put("inviteLink", response);
        data.put("createdBy", requesterId);
        webSocketMessageService.pushConversationUpdate(
                conversationId,
                participantIds,
                "INVITE_LINK_CREATED",
                data
        );

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Invite link created successfully", response));
    }

    @PutMapping("/{conversationId}/invite-link/active")
    @Operation(summary = "Update invite link active status")
    public ResponseEntity<ApiResponse<InviteLinkResponse>> updateInviteLinkActive(
            @PathVariable String conversationId,
            @RequestBody Map<String, Boolean> request) {
        String requesterId = securityUtil.getCurrentUserId();
        Boolean active = request.get("active");
        log.info("Update invite link active status for conversation: {} by user: {}, active: {}", 
                conversationId, requesterId, active);

        if (active == null) {
            throw new com.hoanghuy04.instagrambackend.exception.BadRequestException("active field is required");
        }

        InviteLinkResponse response = conversationInviteService.updateInviteLinkActive(
                conversationId, requesterId, active);

        return ResponseEntity.ok(ApiResponse.success(
                active ? "Invite link enabled successfully" : "Invite link disabled successfully", 
                response));
    }

    @GetMapping("/{conversationId}/invite-link")
    @Operation(summary = "Get active invite link for a group conversation")
    public ResponseEntity<ApiResponse<InviteLinkResponse>> getActiveInviteLink(
            @PathVariable String conversationId) {
        String requesterId = securityUtil.getCurrentUserId();
        log.info("Get invite link request for conversation: {} by user: {}", conversationId, requesterId);

        InviteLinkResponse response = conversationInviteService.getActiveInviteLink(conversationId, requesterId);
        if (response == null) {
            return ResponseEntity.ok(ApiResponse.success("No active invite link found", null));
        }

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/{conversationId}/invite-link")
    @Operation(summary = "Revoke invite link for a group conversation")
    public ResponseEntity<ApiResponse<Void>> revokeInviteLink(
            @PathVariable String conversationId) {
        String requesterId = securityUtil.getCurrentUserId();
        log.info("Revoke invite link request for conversation: {} by user: {}", conversationId, requesterId);

        conversationInviteService.revokeInviteLink(conversationId, requesterId);

        // Notify all participants about the revoked invite link
        ConversationResponse dto = conversationMessageService.getConversationAsDTO(conversationId, requesterId);
        List<String> participantIds = dto.getParticipants().stream()
                .map(p -> p.getUserId())
                .collect(Collectors.toList());
        Map<String, Object> data = new java.util.HashMap<>();
        data.put("revokedBy", requesterId);
        webSocketMessageService.pushConversationUpdate(
                conversationId,
                participantIds,
                "INVITE_LINK_REVOKED",
                data
        );

        return ResponseEntity.ok(ApiResponse.success("Invite link revoked successfully", null));
    }

    @PostMapping("/join/{token}")
    @Operation(summary = "Join a conversation using an invite token")
    public ResponseEntity<ApiResponse<ConversationResponse>> joinConversationViaInvite(
            @PathVariable String token) {
        String userId = securityUtil.getCurrentUserId();
        log.info("Join conversation via invite token request by user: {}", userId);

        ConversationResponse response = conversationInviteService.joinByInviteToken(token, userId);

        // Notify all participants about the new member
        List<String> participantIds = response.getParticipants().stream()
                .map(p -> p.getUserId())
                .collect(Collectors.toList());
        Map<String, Object> data = new java.util.HashMap<>();
        data.put("joinedUserId", userId);
        data.put("conversation", response);
        webSocketMessageService.pushConversationUpdate(
                response.getId(),
                participantIds,
                "MEMBER_JOINED",
                data
        );

        return ResponseEntity.ok(ApiResponse.success("Joined conversation successfully", response));
    }
}

