package com.hoanghuy04.instagrambackend.controller;

import com.hoanghuy04.instagrambackend.dto.request.SendMessageRequest;
import com.hoanghuy04.instagrambackend.dto.response.ApiResponse;
import com.hoanghuy04.instagrambackend.dto.response.Conversation;
import com.hoanghuy04.instagrambackend.dto.response.MessageResponse;
import com.hoanghuy04.instagrambackend.dto.response.PageResponse;
import com.hoanghuy04.instagrambackend.service.MessageService;
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
 * REST controller for message management endpoints.
 * Handles direct messaging between users.
 * 
 * @author Instagram Backend Team
 * @version 1.0.0
 */
@Slf4j
@RestController
@RequestMapping("/messages")
@RequiredArgsConstructor
@Tag(name = "Messages", description = "Message management APIs")
@SecurityRequirement(name = "Bearer Authentication")
public class MessageController {
    
    private final MessageService messageService;
    
    /**
     * Send a message.
     *
     * @param request the message send request
     * @param senderId the sender user ID
     * @return ResponseEntity with MessageResponse
     */
    @PostMapping
    @Operation(summary = "Send a message")
    public ResponseEntity<ApiResponse<MessageResponse>> sendMessage(
            @Valid @RequestBody SendMessageRequest request,
            @RequestParam String senderId) {
        log.info("Send message request received from user: {}", senderId);
        
        MessageResponse response = messageService.sendMessage(request, senderId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Message sent successfully", response));
    }
    
    /**
     * Get conversation with a user.
     *
     * @param conversationId the other user ID (conversation partner)
     * @param userId the current user ID
     * @param pageable pagination information
     * @return ResponseEntity with PageResponse of MessageResponse
     */
    @GetMapping("/{conversationId}")
    @Operation(summary = "Get conversation with a user, and pagination by createdAt descending")
    public ResponseEntity<ApiResponse<PageResponse<MessageResponse>>> getConversation(
            @PathVariable String conversationId,
            @RequestParam String userId,
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        log.info("Get conversation request received for user: {}", userId);
        
        PageResponse<MessageResponse> response = messageService.getConversation(userId, conversationId, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    /**
     * Get all conversations for a user.
     *
     * @param userId the user ID
     * @param pageable pagination information
     * @return ResponseEntity with PageResponse of Conversation
     */
    @GetMapping
    @Operation(summary = "Get all conversations")
    public ResponseEntity<ApiResponse<PageResponse<Conversation>>> getConversations(
            @RequestParam String userId,
            Pageable pageable) {
        log.info("Get all conversations request received for user: {}", userId);
        
        PageResponse<Conversation> response = messageService.getConversations(userId, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    /**
     * Mark message as read.
     *
     * @param id the message ID
     * @return ResponseEntity with success message
     */
    @PutMapping("/{id}/read")
    @Operation(summary = "Mark message as read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(@PathVariable String id) {
        log.info("Mark message as read request received for message: {}", id);
        
        messageService.markAsRead(id);
        return ResponseEntity.ok(ApiResponse.success("Message marked as read", null));
    }
    
    /**
     * Delete a message.
     *
     * @param id the message ID
     * @return ResponseEntity with success message
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a message")
    public ResponseEntity<ApiResponse<Void>> deleteMessage(@PathVariable String id) {
        log.info("Delete message request received for message: {}", id);
        
        messageService.deleteMessage(id);
        return ResponseEntity.ok(ApiResponse.success("Message deleted successfully", null));
    }
    
    /**
     * Pin a conversation.
     *
     * @param partnerId the partner ID
     * @param userId the user ID
     * @return ResponseEntity with success message
     */
    @PutMapping("/conversations/{partnerId}/pin")
    @Operation(summary = "Pin a conversation")
    public ResponseEntity<ApiResponse<Void>> pinConversation(
            @PathVariable String partnerId,
            @RequestParam String userId) {
        log.info("Pin conversation request received for user {} with partner: {}", userId, partnerId);
        
        messageService.pinConversation(userId, partnerId);
        return ResponseEntity.ok(ApiResponse.success("Conversation pinned successfully", null));
    }
    
    /**
     * Unpin a conversation.
     *
     * @param partnerId the partner ID
     * @param userId the user ID
     * @return ResponseEntity with success message
     */
    @PutMapping("/conversations/{partnerId}/unpin")
    @Operation(summary = "Unpin a conversation")
    public ResponseEntity<ApiResponse<Void>> unpinConversation(
            @PathVariable String partnerId,
            @RequestParam String userId) {
        log.info("Unpin conversation request received for user {} with partner: {}", userId, partnerId);
        
        messageService.unpinConversation(userId, partnerId);
        return ResponseEntity.ok(ApiResponse.success("Conversation unpinned successfully", null));
    }
    
    /**
     * Delete a conversation.
     *
     * @param partnerId the partner ID
     * @param userId the user ID
     * @return ResponseEntity with success message
     */
    @DeleteMapping("/conversations/{partnerId}")
    @Operation(summary = "Delete a conversation")
    public ResponseEntity<ApiResponse<Void>> deleteConversation(
            @PathVariable String partnerId,
            @RequestParam String userId) {
        log.info("Delete conversation request received for user {} with partner: {}", userId, partnerId);
        
        messageService.deleteConversation(userId, partnerId);
        return ResponseEntity.ok(ApiResponse.success("Conversation deleted successfully", null));
    }
}

