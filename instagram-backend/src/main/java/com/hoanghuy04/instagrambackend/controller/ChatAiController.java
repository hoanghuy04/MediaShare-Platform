package com.hoanghuy04.instagrambackend.controller;

import com.hoanghuy04.instagrambackend.dto.request.SendMessageRequest;
import com.hoanghuy04.instagrambackend.dto.response.ApiResponse;
import com.hoanghuy04.instagrambackend.dto.response.ConversationResponse;
import com.hoanghuy04.instagrambackend.dto.response.MessageResponse;
import com.hoanghuy04.instagrambackend.service.ai.AiChatService;
import com.hoanghuy04.instagrambackend.util.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller for AI chat operations.
 * Handles AI conversation management and message processing.
 *
 * @author Instagram Backend Team
 * @version 1.0.0
 */
@RestController
@RequestMapping("/ai")
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
@Tag(name = "AI Chat", description = "AI chat conversation endpoints")
public class ChatAiController {

    AiChatService aiChatService;
    SecurityUtil securityUtil;

    /**
     * Send a message to AI assistant.
     * Automatically creates or finds conversation with AI.
     *
     * @param request the message request containing content
     * @return AI response message
     */
    @PostMapping("/chat")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Send message to AI", description = "Send a prompt to AI and get response")
    public ResponseEntity<ApiResponse<MessageResponse>> sendAiMessage(
            @Valid @RequestBody SendMessageRequest request
    ) {
        String currentUserId = securityUtil.getCurrentUserId();
        MessageResponse response = aiChatService.sendPromptAndGetResponse(
                currentUserId,
                request.getContent(),
                request.getConversationId()
        );
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("AI responded successfully", response));
    }

    /**
     * Get or create AI conversation for current user.
     *
     * @return Conversation details
     */
    @GetMapping("/conversation")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Get AI conversation", description = "Get or create conversation with AI assistant")
    public ResponseEntity<ApiResponse<ConversationResponse>> getAiConversation() {
        String currentUserId = securityUtil.getCurrentUserId();
        ConversationResponse conversation = aiChatService.getAiConversation(currentUserId);
        return ResponseEntity.ok(ApiResponse.success("AI conversation retrieved", conversation));
    }

    /**
     * Clear AI conversation history for current user.
     * This removes all messages from the conversation memory.
     *
     * @return Success response
     */
    @DeleteMapping("/conversation/history")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Clear AI conversation history", description = "Delete all messages in AI conversation")
    public ResponseEntity<ApiResponse<Void>> clearConversationHistory() {
        String currentUserId = securityUtil.getCurrentUserId();
        aiChatService.clearConversationHistory(currentUserId);
        return ResponseEntity.ok(ApiResponse.success("Conversation history cleared", null));
    }

    /**
     * Alternative endpoint for backward compatibility.
     * Send message with explicit userId parameter (for admin/testing).
     *
     * @param userId the user ID
     * @param request the message request
     * @return AI response message
     */
    @PostMapping("/chat/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Send message to AI (Admin)", description = "Send prompt to AI on behalf of a user")
    public ResponseEntity<ApiResponse<MessageResponse>> sendAiMessageForUser(
            @PathVariable String userId,
            @Valid @RequestBody SendMessageRequest request
    ) {
        MessageResponse response = aiChatService.sendPromptAndGetResponse(
                userId,
                request.getContent(),
                request.getConversationId()
        );
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("AI responded successfully", response));
    }
}
