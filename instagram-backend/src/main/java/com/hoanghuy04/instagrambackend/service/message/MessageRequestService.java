package com.hoanghuy04.instagrambackend.service.message;

import com.hoanghuy04.instagrambackend.entity.Message;
import com.hoanghuy04.instagrambackend.entity.message.Conversation;
import com.hoanghuy04.instagrambackend.entity.message.MessageRequest;
import com.hoanghuy04.instagrambackend.enums.RequestStatus;
import com.hoanghuy04.instagrambackend.exception.BadRequestException;
import com.hoanghuy04.instagrambackend.exception.ResourceNotFoundException;
import com.hoanghuy04.instagrambackend.repository.MessageRepository;
import com.hoanghuy04.instagrambackend.repository.message.MessageRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Service class for message request operations.
 * Handles message requests for users who are not connected.
 * 
 * @author Instagram Backend Team
 * @version 2.0.0
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MessageRequestService {
    
    private final MessageRequestRepository messageRequestRepository;
    private final ConversationService conversationService;
    private final MessageRepository messageRepository;
    
    /**
     * Create a new message request.
     *
     * @param senderId the sender user ID
     * @param receiverId the receiver user ID
     * @param firstMessage the first message in the request
     * @return MessageRequest entity
     */
    @Transactional
    public MessageRequest createMessageRequest(String senderId, String receiverId, Message firstMessage) {
        log.info("Creating message request from {} to {}", senderId, receiverId);
        
        // Check if request already exists
        Optional<MessageRequest> existing = messageRequestRepository.findBySenderIdAndReceiverIdAndStatus(
            senderId, 
            receiverId, 
            RequestStatus.PENDING
        );
        
        if (existing.isPresent()) {
            // Add message to existing request
            MessageRequest request = existing.get();
            request.getPendingMessageIds().add(firstMessage.getId());
            request = messageRequestRepository.save(request);
            log.info("Added message to existing request: {}", request.getId());
            return request;
        }
        
        // Create new request
        MessageRequest request = MessageRequest.builder()
            .sender(firstMessage.getSender())
            .receiver(firstMessage.getReceiver())
            .status(RequestStatus.PENDING)
            .firstMessage(firstMessage)
            .pendingMessageIds(List.of(firstMessage.getId()))
            .createdAt(LocalDateTime.now())
            .build();
        
        request = messageRequestRepository.save(request);
        log.info("Created new message request: {}", request.getId());
        
        return request;
    }
    
    /**
     * Get pending message requests for a user.
     *
     * @param userId the user ID
     * @return List of pending message requests
     */
    @Transactional(readOnly = true)
    public List<MessageRequest> getPendingRequests(String userId) {
        log.debug("Getting pending requests for user: {}", userId);
        
        return messageRequestRepository.findByReceiverIdAndStatusOrderByCreatedAtDesc(
            userId, 
            RequestStatus.PENDING
        );
    }
    
    /**
     * Accept a message request.
     * This will create a conversation and move pending messages to it.
     *
     * @param requestId the request ID
     * @param userId the user who accepts the request
     * @return Conversation entity
     */
    @Transactional
    public Conversation acceptRequest(String requestId, String userId) {
        log.info("Accepting message request {} by user {}", requestId, userId);
        
        MessageRequest request = getRequestById(requestId);
        
        // Verify user is the receiver
        if (!request.getReceiver().getId().equals(userId)) {
            throw new BadRequestException("You can only accept your own requests");
        }
        
        // Update request status
        request.setStatus(RequestStatus.ACCEPTED);
        request.setRespondedAt(LocalDateTime.now());
        messageRequestRepository.save(request);
        
        // Create or get conversation
        Conversation conversation = conversationService.getOrCreateDirectConversation(
            request.getSender().getId(), 
            request.getReceiver().getId()
        );
        
        // Link all pending messages to the conversation
        if (request.getPendingMessageIds() != null && !request.getPendingMessageIds().isEmpty()) {
            for (String messageId : request.getPendingMessageIds()) {
                try {
                    Message message = messageRepository.findById(messageId).orElse(null);
                    if (message != null && message.getConversation() == null) {
                        message.setConversation(conversation);
                        messageRepository.save(message);
                    }
                } catch (Exception e) {
                    log.warn("Failed to link message {} to conversation: {}", messageId, e.getMessage());
                }
            }
            log.info("Linked {} pending messages to conversation", request.getPendingMessageIds().size());
        }
        
        log.info("Request accepted successfully, conversation: {}", conversation.getId());
        return conversation;
    }
    
    /**
     * Reject a message request.
     *
     * @param requestId the request ID
     * @param userId the user who rejects the request
     */
    @Transactional
    public void rejectRequest(String requestId, String userId) {
        log.info("Rejecting message request {} by user {}", requestId, userId);
        
        MessageRequest request = getRequestById(requestId);
        
        // Verify user is the receiver
        if (!request.getReceiver().getId().equals(userId)) {
            throw new BadRequestException("You can only reject your own requests");
        }
        
        // Update request status
        request.setStatus(RequestStatus.REJECTED);
        request.setRespondedAt(LocalDateTime.now());
        messageRequestRepository.save(request);
        
        log.info("Request rejected successfully");
    }
    
    /**
     * Ignore a message request.
     *
     * @param requestId the request ID
     * @param userId the user who ignores the request
     */
    @Transactional
    public void ignoreRequest(String requestId, String userId) {
        log.info("Ignoring message request {} by user {}", requestId, userId);
        
        MessageRequest request = getRequestById(requestId);
        
        // Verify user is the receiver
        if (!request.getReceiver().getId().equals(userId)) {
            throw new BadRequestException("You can only ignore your own requests");
        }
        
        // Update request status
        request.setStatus(RequestStatus.IGNORED);
        request.setRespondedAt(LocalDateTime.now());
        messageRequestRepository.save(request);
        
        log.info("Request ignored successfully");
    }
    
    /**
     * Count pending requests for a user.
     *
     * @param userId the user ID
     * @return number of pending requests
     */
    @Transactional(readOnly = true)
    public long countPendingRequests(String userId) {
        return messageRequestRepository.countByReceiverIdAndStatus(userId, RequestStatus.PENDING);
    }
    
    /**
     * Add a message to an existing pending request.
     *
     * @param requestId the request ID
     * @param message the message to add
     */
    @Transactional
    public void addPendingMessage(String requestId, Message message) {
        log.debug("Adding message to request: {}", requestId);
        
        MessageRequest request = getRequestById(requestId);
        
        if (request.getStatus() != RequestStatus.PENDING) {
            throw new BadRequestException("Can only add messages to pending requests");
        }
        
        request.getPendingMessageIds().add(message.getId());
        messageRequestRepository.save(request);
    }
    
    /**
     * Check if an active request exists between two users.
     *
     * @param senderId the sender ID
     * @param receiverId the receiver ID
     * @return true if active request exists
     */
    @Transactional(readOnly = true)
    public boolean hasActiveRequest(String senderId, String receiverId) {
        return messageRequestRepository.findBySenderIdAndReceiverIdAndStatus(
            senderId, 
            receiverId, 
            RequestStatus.PENDING
        ).isPresent();
    }
    
    /**
     * Get request by ID.
     *
     * @param requestId the request ID
     * @return MessageRequest entity
     */
    @Transactional(readOnly = true)
    public MessageRequest getRequestById(String requestId) {
        return messageRequestRepository.findById(requestId)
            .orElseThrow(() -> new ResourceNotFoundException("Message request not found with id: " + requestId));
    }
}

