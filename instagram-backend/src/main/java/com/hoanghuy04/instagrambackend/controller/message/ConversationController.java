package com.hoanghuy04.instagrambackend.controller.message;

import com.hoanghuy04.instagrambackend.dto.message.request.AddMemberRequest;
import com.hoanghuy04.instagrambackend.dto.message.request.CreateGroupRequest;
import com.hoanghuy04.instagrambackend.dto.message.request.UpdateGroupRequest;
import com.hoanghuy04.instagrambackend.dto.message.response.ConversationDTO;
import com.hoanghuy04.instagrambackend.dto.message.response.MessageDTO;
import com.hoanghuy04.instagrambackend.dto.response.ApiResponse;
import com.hoanghuy04.instagrambackend.dto.response.PageResponse;
import com.hoanghuy04.instagrambackend.service.message.ConversationMessageService;
import com.hoanghuy04.instagrambackend.service.message.ConversationService;
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
    
    /**
     * Get all conversations for a user.
     *
     * @param userId the user ID
     * @param pageable pagination information
     * @return ResponseEntity with PageResponse of ConversationDTO
     */
    @GetMapping
    @Operation(summary = "Get all conversations for a user")
    public ResponseEntity<ApiResponse<PageResponse<ConversationDTO>>> getConversations(
            @RequestParam String userId,
            @PageableDefault(sort = "updatedAt", direction = Sort.Direction.DESC) Pageable pageable) {
        log.info("Get all conversations request received for user: {}", userId);
        
        PageResponse<ConversationDTO> response = conversationMessageService.getUserConversationsAsDTO(userId, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    /**
     * Get conversation details by ID.
     *
     * @param conversationId the conversation ID
     * @param userId the user ID (to verify access and calculate unread count)
     * @return ResponseEntity with ConversationDTO
     */
    @GetMapping("/{conversationId}")
    @Operation(summary = "Get conversation details")
    public ResponseEntity<ApiResponse<ConversationDTO>> getConversation(
            @PathVariable String conversationId,
            @RequestParam String userId) {
        log.info("Get conversation request received for conversation: {} by user: {}", conversationId, userId);
        
        ConversationDTO response = conversationMessageService.getConversationAsDTO(conversationId, userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    /**
     * Get messages in a conversation.
     *
     * @param conversationId the conversation ID
     * @param userId the user ID (to verify access)
     * @param pageable pagination information
     * @return ResponseEntity with PageResponse of MessageDTO
     */
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
    
    /**
     * Create a new group conversation.
     *
     * @param request the create group request
     * @param creatorId the creator user ID
     * @return ResponseEntity with ConversationDTO
     */
    @PostMapping("/group")
    @Operation(summary = "Create a new group conversation")
    public ResponseEntity<ApiResponse<ConversationDTO>> createGroup(
            @Valid @RequestBody CreateGroupRequest request,
            @RequestParam String creatorId) {
        log.info("Create group request received by user: {}, name: {}", creatorId, request.getGroupName());
        
        ConversationDTO response = conversationMessageService.createGroupAndConvertToDTO(
            creatorId,
            request.getParticipantIds(),
            request.getGroupName(),
            request.getAvatar()
        );
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Group created successfully", response));
    }
    
    /**
     * Update group conversation information.
     *
     * @param conversationId the conversation ID
     * @param request the update request
     * @param userId the user ID (must be admin)
     * @return ResponseEntity with ConversationDTO
     */
    @PutMapping("/{conversationId}")
    @Operation(summary = "Update group conversation information")
    public ResponseEntity<ApiResponse<ConversationDTO>> updateGroup(
            @PathVariable String conversationId,
            @Valid @RequestBody UpdateGroupRequest request,
            @RequestParam String userId) {
        log.info("Update group request received for conversation: {} by user: {}", conversationId, userId);
        
        ConversationDTO response = conversationMessageService.updateGroupAndConvertToDTO(
            conversationId,
            request.getName(),
            request.getAvatar(),
            userId
        );
        return ResponseEntity.ok(ApiResponse.success("Group updated successfully", response));
    }
    
    /**
     * Add members to a group conversation.
     *
     * @param conversationId the conversation ID
     * @param request the add member request
     * @param addedBy the user ID who adds the members (must be admin)
     * @return ResponseEntity with success message
     */
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
    
    /**
     * Remove a member from a group conversation.
     *
     * @param conversationId the conversation ID
     * @param userId the user ID to remove
     * @param removedBy the user ID who removes the member (must be admin)
     * @return ResponseEntity with success message
     */
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
    
    /**
     * Leave a group conversation.
     *
     * @param conversationId the conversation ID
     * @param userId the user ID who leaves
     * @return ResponseEntity with success message
     */
    @PostMapping("/{conversationId}/leave")
    @Operation(summary = "Leave a group conversation")
    public ResponseEntity<ApiResponse<Void>> leaveGroup(
            @PathVariable String conversationId,
            @RequestParam String userId) {
        log.info("Leave group request received for conversation: {} by user: {}", conversationId, userId);
        
        conversationService.leaveGroup(conversationId, userId);
        return ResponseEntity.ok(ApiResponse.success("Left group successfully", null));
    }
    
    /**
     * Delete a conversation for a user (soft delete).
     * This hides the conversation from user's list but keeps it visible to others.
     *
     * @param conversationId the conversation ID
     * @param userId the user ID
     * @return ResponseEntity with success message
     */
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



