package com.hoanghuy04.instagrambackend.controller;

import com.hoanghuy04.instagrambackend.dto.request.AddMemberRequest;
import com.hoanghuy04.instagrambackend.dto.request.CreateGroupRequest;
import com.hoanghuy04.instagrambackend.dto.request.SendMessageRequest;
import com.hoanghuy04.instagrambackend.dto.request.UpdateGroupRequest;
import com.hoanghuy04.instagrambackend.dto.response.ConversationDTO;
import com.hoanghuy04.instagrambackend.dto.response.MessageDTO;
import com.hoanghuy04.instagrambackend.dto.response.ApiResponse;
import com.hoanghuy04.instagrambackend.dto.response.PageResponse;
import com.hoanghuy04.instagrambackend.entity.Message;
import com.hoanghuy04.instagrambackend.mapper.MessageMapper;
import com.hoanghuy04.instagrambackend.service.message.ConversationMessageServiceImpl;
import com.hoanghuy04.instagrambackend.service.message.ConversationServiceImpl;
import com.hoanghuy04.instagrambackend.service.message.WebSocketMessageServiceImpl;
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
    
    private final ConversationServiceImpl conversationService;
    private final ConversationMessageServiceImpl conversationMessageService;
    private final WebSocketMessageServiceImpl webSocketMessageService;
    private final MessageMapper messageMapper;
    
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
     * Send a direct message to a user.
     * Automatically creates a conversation if it doesn't exist.
     *
     * @param request the send message request (receiverId, content, mediaUrl)
     * @param senderId the sender user ID
     * @return ResponseEntity with MessageDTO
     */
    @PostMapping("/direct/messages")
    @Operation(summary = "Send a direct message to a user (auto-creates conversation)")
    public ResponseEntity<ApiResponse<MessageDTO>> sendDirectMessage(
            @Valid @RequestBody SendMessageRequest request,
            @RequestParam String senderId) {
        log.info("Send direct message from user {} to user {}", senderId, request.getReceiverId());
        
        if (request.getReceiverId() == null || request.getReceiverId().isBlank()) {
            throw new com.hoanghuy04.instagrambackend.exception.BadRequestException("receiverId is required for direct messages");
        }
        
        // Use ConversationMessageService.sendMessage which handles conversation creation
        Message message = conversationMessageService.sendMessage(
            senderId,
            request.getReceiverId(),
            request.getContent(),
            request.getMediaUrl()
        );
        
        // Push via WebSocket
        webSocketMessageService.pushMessage(message);
        
        MessageDTO dto = messageMapper.toMessageDTO(message, senderId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Message sent successfully", dto));
    }
    
    /**
     * Send a message to a conversation.
     * conversationId is taken from path parameter.
     *
     * @param conversationId the conversation ID
     * @param request the send message request (content, mediaUrl, replyToMessageId)
     * @param senderId the sender user ID
     * @return ResponseEntity with MessageDTO
     */
    @PostMapping("/{conversationId}/messages")
    @Operation(summary = "Send a message to a conversation")
    public ResponseEntity<ApiResponse<MessageDTO>> sendMessage(
            @PathVariable String conversationId,
            @Valid @RequestBody SendMessageRequest request,
            @RequestParam String senderId) {
        log.info("Send message to conversation {} by user {}", conversationId, senderId);
        
        Message message;
        if (request.getReplyToMessageId() != null && !request.getReplyToMessageId().isBlank()) {
            // Send as reply
            message = conversationMessageService.replyToMessage(
                conversationId, 
                senderId, 
                request.getReplyToMessageId(), 
                request.getContent()
            );
        } else {
            // Send normal message
            message = conversationMessageService.sendMessageToConversation(
                conversationId, 
                senderId, 
                request.getContent(), 
                request.getMediaUrl()
            );
        }
        
        // Push via WebSocket
        webSocketMessageService.pushMessage(message);
        
        MessageDTO dto = messageMapper.toMessageDTO(message, senderId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Message sent successfully", dto));
    }
    
    /**
     * Mark a message as read.
     * This will mark all messages in the conversation as read (Instagram-style).
     *
     * @param messageId the message ID
     * @param userId the user ID who reads the message
     * @return ResponseEntity with success message
     */
    @PostMapping("/messages/{messageId}/read")
    @Operation(summary = "Mark message as read (marks all in conversation)")
    public ResponseEntity<ApiResponse<Void>> markMessageAsRead(
            @PathVariable String messageId,
            @RequestParam String userId) {
        log.info("Mark message {} as read by user {}", messageId, userId);
        
        conversationMessageService.markAsRead(messageId, userId);
        return ResponseEntity.ok(ApiResponse.success("Message marked as read", null));
    }
    
    /**
     * Delete a message for user (soft delete).
     *
     * @param messageId the message ID
     * @param userId the user ID
     * @return ResponseEntity with success message
     */
    @DeleteMapping("/messages/{messageId}")
    @Operation(summary = "Delete a message for user (soft delete)")
    public ResponseEntity<ApiResponse<Void>> deleteMessage(
            @PathVariable String messageId,
            @RequestParam String userId) {
        log.info("Delete message {} for user {}", messageId, userId);
        
        conversationMessageService.deleteMessageForUser(messageId, userId);
        return ResponseEntity.ok(ApiResponse.success("Message deleted successfully", null));
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



