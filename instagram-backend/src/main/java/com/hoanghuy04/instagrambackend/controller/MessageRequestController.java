package com.hoanghuy04.instagrambackend.controller;

import com.hoanghuy04.instagrambackend.dto.response.ConversationDTO;
import com.hoanghuy04.instagrambackend.dto.response.MessageRequestDTO;
import com.hoanghuy04.instagrambackend.dto.response.ApiResponse;
import com.hoanghuy04.instagrambackend.entity.message.Conversation;
import com.hoanghuy04.instagrambackend.service.message.ConversationMessageService;
import com.hoanghuy04.instagrambackend.service.message.MessageRequestService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller for managing message requests from non-connected users.
 */
@Slf4j
@RestController
@RequestMapping("/message-requests")
@RequiredArgsConstructor
@Tag(name = "Message Requests", description = "APIs for managing message requests")
public class MessageRequestController {
    
    private final MessageRequestService messageRequestService;
    private final ConversationMessageService conversationMessageService;
    
    /**
     * Get all pending message requests for a user.
     *
     * @param userId the user ID to get requests for
     * @return List of pending message requests
     */
    @GetMapping
    @Operation(summary = "Get pending message requests")
    public ResponseEntity<ApiResponse<List<MessageRequestDTO>>> getPendingRequests(
            @RequestParam String userId) {
        
        log.info("Get pending message requests for user {}", userId);
        List<MessageRequestDTO> requests = messageRequestService.getPendingRequests(userId);
        return ResponseEntity.ok(
            ApiResponse.success("Pending requests retrieved successfully", requests)
        );
    }
    
    /**
     * Get count of pending message requests for a user.
     *
     * @param userId the user ID to count requests for
     * @return Count of pending requests
     */
    @GetMapping("/count")
    @Operation(summary = "Get pending message requests count")
    public ResponseEntity<ApiResponse<Integer>> getPendingRequestsCount(
            @RequestParam String userId) {
        
        log.info("Get pending message requests count for user {}", userId);
        int count = messageRequestService.getPendingRequestsCount(userId);
        return ResponseEntity.ok(
            ApiResponse.success("Pending requests count retrieved successfully", count)
        );
    }
    
    /**
     * Accept a message request.
     *
     * @param requestId the request ID to accept
     * @param userId the user ID accepting the request
     * @return The created conversation
     */
    @PostMapping("/{requestId}/accept")
    @Operation(summary = "Accept a message request")
    public ResponseEntity<ApiResponse<ConversationDTO>> acceptRequest(
            @PathVariable String requestId,
            @RequestParam String userId) {
        
        log.info("Accept message request {} by user {}", requestId, userId);
        Conversation conversation = messageRequestService.acceptRequest(requestId, userId);
        
        // Convert to DTO
        ConversationDTO conversationDTO = conversationMessageService.convertToConversationDTO(conversation, userId);
        
        return ResponseEntity.ok(
            ApiResponse.success("Message request accepted successfully", conversationDTO)
        );
    }
    
    /**
     * Reject a message request.
     *
     * @param requestId the request ID to reject
     * @param userId the user ID rejecting the request
     * @return Success response
     */
    @PostMapping("/{requestId}/reject")
    @Operation(summary = "Reject a message request")
    public ResponseEntity<ApiResponse<Void>> rejectRequest(
            @PathVariable String requestId,
            @RequestParam String userId) {
        
        log.info("Reject message request {} by user {}", requestId, userId);
        messageRequestService.rejectRequest(requestId, userId);
        return ResponseEntity.ok(
            ApiResponse.success("Message request rejected successfully", null)
        );
    }
    
    /**
     * Ignore a message request.
     *
     * @param requestId the request ID to ignore
     * @param userId the user ID ignoring the request
     * @return Success response
     */
    @PostMapping("/{requestId}/ignore")
    @Operation(summary = "Ignore a message request")
    public ResponseEntity<ApiResponse<Void>> ignoreRequest(
            @PathVariable String requestId,
            @RequestParam String userId) {
        
        log.info("Ignore message request {} by user {}", requestId, userId);
        messageRequestService.ignoreRequest(requestId, userId);
        return ResponseEntity.ok(
            ApiResponse.success("Message request ignored successfully", null)
        );
    }
}

