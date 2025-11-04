package com.hoanghuy04.instagrambackend.controller.message;

import com.hoanghuy04.instagrambackend.dto.response.ApiResponse;
import com.hoanghuy04.instagrambackend.service.message.ConversationMessageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for conversation management endpoints.
 * Handles conversation operations like deleting conversations.
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
    
    private final ConversationMessageService conversationMessageService;
    
    /**
     * Delete a conversation for a user (soft delete).
     * This hides the conversation from user's list but keeps it visible to others.
     *
     * @param conversationId the conversation ID
     * @param userId the user ID
     * @return ResponseEntity with success message
     */
    @DeleteMapping("/{conversationId}")
    @Operation(summary = "Delete a conversation for a user")
    public ResponseEntity<ApiResponse<Void>> deleteConversation(
            @PathVariable String conversationId,
            @RequestParam String userId) {
        log.info("Delete conversation request received for conversation: {} by user: {}", conversationId, userId);
        
        conversationMessageService.deleteConversationForUser(conversationId, userId);
        return ResponseEntity.ok(ApiResponse.success("Conversation deleted successfully", null));
    }
}



