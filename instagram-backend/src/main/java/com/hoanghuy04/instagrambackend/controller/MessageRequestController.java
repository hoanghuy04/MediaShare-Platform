package com.hoanghuy04.instagrambackend.controller;

import com.hoanghuy04.instagrambackend.dto.response.InboxItemDTO;
import com.hoanghuy04.instagrambackend.dto.response.MessageDTO;
import com.hoanghuy04.instagrambackend.dto.response.MessageRequestDTO;
import com.hoanghuy04.instagrambackend.dto.response.ApiResponse;
import com.hoanghuy04.instagrambackend.dto.response.PageResponse;
import com.hoanghuy04.instagrambackend.service.message.MessageRequestService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
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
     * Get pending inbox items (received requests only) for a user.
     * Used for the "Pending Messages" tab - shows requests that others sent to the user.
     *
     * @param userId the user ID (receiver)
     * @param pageable pagination information
     * @return PageResponse of InboxItemDTO
     */
    @GetMapping("/inbox")
    @Operation(summary = "Get pending inbox items (received requests only)")
    public ResponseEntity<ApiResponse<PageResponse<InboxItemDTO>>> getPendingInboxItems(
            @RequestParam String userId,
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        
        log.info("Get pending inbox items for user {} (page: {}, size: {})", 
            userId, pageable.getPageNumber(), pageable.getPageSize());
        
        PageResponse<InboxItemDTO> pageResponse = messageRequestService.getPendingInboxItems(userId, pageable);
        return ResponseEntity.ok(
            ApiResponse.success("Pending inbox items retrieved successfully", pageResponse)
        );
    }
    
    /**
     * Get all pending messages for a message request between sender and receiver.
     * This is used when the sender wants to view their sent messages that haven't been accepted yet.
     *
     * @param senderId the sender user ID
     * @param receiverId the receiver user ID
     * @return List of pending messages
     */
    @GetMapping("/pending-messages")
    @Operation(summary = "Get pending messages for a message request")
    public ResponseEntity<ApiResponse<List<MessageDTO>>> getPendingMessages(
            @RequestParam String senderId,
            @RequestParam String receiverId) {
        
        log.info("Get pending messages from {} to {}", senderId, receiverId);
        List<MessageDTO> messages = messageRequestService.getPendingMessages(senderId, receiverId);
        return ResponseEntity.ok(
            ApiResponse.success("Pending messages loaded successfully", messages)
        );
    }
    
    /**
     * Get all pending messages for a message request by request ID.
     * BE automatically reads senderId/receiverId from the MessageRequest.
     * This is more stable than passing senderId/receiverId separately.
     *
     * @param requestId the message request ID
     * @param userId the user ID viewing the messages (for context and authorization)
     * @return List of pending messages
     */
    @GetMapping("/{requestId}/pending-messages")
    @Operation(summary = "Get pending messages for a message request by request ID")
    public ResponseEntity<ApiResponse<List<MessageDTO>>> getPendingMessagesByRequestId(
            @PathVariable String requestId,
            @RequestParam String userId) {
        
        log.info("Get pending messages for request {} by user {}", requestId, userId);
        List<MessageDTO> messages = messageRequestService.getPendingMessagesByRequestId(requestId, userId);
        return ResponseEntity.ok(
            ApiResponse.success("Pending messages loaded successfully", messages)
        );
    }
}

