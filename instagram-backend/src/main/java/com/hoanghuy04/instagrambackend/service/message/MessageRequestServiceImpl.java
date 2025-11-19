package com.hoanghuy04.instagrambackend.service.message;

import com.hoanghuy04.instagrambackend.dto.response.MessageDTO;
import com.hoanghuy04.instagrambackend.dto.response.MessageRequestDTO;
import com.hoanghuy04.instagrambackend.entity.Message;
import com.hoanghuy04.instagrambackend.entity.message.Conversation;
import com.hoanghuy04.instagrambackend.entity.message.MessageRequest;
import com.hoanghuy04.instagrambackend.enums.RequestStatus;
import com.hoanghuy04.instagrambackend.exception.BadRequestException;
import com.hoanghuy04.instagrambackend.exception.ResourceNotFoundException;
import com.hoanghuy04.instagrambackend.mapper.MessageMapper;
import com.hoanghuy04.instagrambackend.mapper.MessageRequestMapper;
import com.hoanghuy04.instagrambackend.repository.MessageRepository;
import com.hoanghuy04.instagrambackend.repository.message.MessageRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

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
public class MessageRequestServiceImpl implements MessageRequestService {
    
    private final MessageRequestRepository messageRequestRepository;
    private final ConversationService conversationService;
    private final MessageRepository messageRepository;
    private final MessageRequestMapper messageRequestMapper;
    private final MessageMapper messageMapper;
    
    @Transactional
    @Override
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
            List<String> pendingIds = request.getPendingMessageIds();
            if (pendingIds == null) {
                pendingIds = new ArrayList<>();
                request.setPendingMessageIds(pendingIds);
            }
            pendingIds.add(firstMessage.getId());
            request.setLastMessageContent(resolvePreviewContent(firstMessage));
            request.setLastMessageTimestamp(firstMessage.getCreatedAt());
            request = messageRequestRepository.save(request);
            log.info("Added message to existing request: {}", request.getId());
            return request;
        }
        
        // Create new request
        MessageRequest request = MessageRequest.builder()
            .senderId(senderId)
            .receiverId(receiverId)
            .sender(firstMessage.getSender())
            .receiver(firstMessage.getReceiver())
            .status(RequestStatus.PENDING)
            .lastMessageContent(resolvePreviewContent(firstMessage))
            .lastMessageTimestamp(firstMessage.getCreatedAt())
            .pendingMessageIds(new ArrayList<>(List.of(firstMessage.getId())))
            .createdAt(LocalDateTime.now())
            .build();
        
        request = messageRequestRepository.save(request);
        log.info("Created new message request: {}", request.getId());
        
        return request;
    }
    
    @Transactional(readOnly = true)
    @Override
    public List<MessageRequestDTO> getPendingRequests(String userId) {
        log.debug("Getting pending requests for user: {}", userId);
        
        List<MessageRequest> requests = messageRequestRepository.findByReceiverIdAndStatusOrderByCreatedAtDesc(
            userId, 
            RequestStatus.PENDING
        );
        
        return requests.stream()
            .map(messageRequestMapper::toMessageRequestDTO)
            .collect(Collectors.toList());
    }
    
    @Transactional
    @Override
    public Conversation acceptRequest(String requestId, String userId) {
        log.info("Accepting message request {} by user {}", requestId, userId);
        
        MessageRequest request = getRequestById(requestId);
        
        // Verify user is the receiver
        if (!request.getReceiverId().equals(userId)) {
            throw new BadRequestException("You can only accept your own requests");
        }

        if (request.getStatus() == RequestStatus.ACCEPTED) {
            log.info("Request {} already accepted earlier. Returning existing conversation", requestId);
            return conversationService.getExistingDirectConversation(request.getSenderId(), request.getReceiverId())
                .orElseThrow(() -> new BadRequestException("Conversation missing for an already accepted request"));
        }

        if (request.getStatus() != RequestStatus.PENDING) {
            throw new BadRequestException("Request is no longer pending");
        }
        
        // Update request status
        request.setStatus(RequestStatus.ACCEPTED);
        request.setRespondedAt(LocalDateTime.now());

        Conversation conversation = conversationService
            .getExistingDirectConversation(request.getSenderId(), request.getReceiverId())
            .orElseGet(() -> conversationService.createDirectConversation(userId, request.getSenderId()));

        Message lastLinkedMessage = linkPendingMessages(conversation, request.getPendingMessageIds());
        if (lastLinkedMessage != null) {
            conversationService.updateLastMessage(conversation.getId(), lastLinkedMessage);
        }

        request.setPendingMessageIds(new ArrayList<>());
        messageRequestRepository.save(request);
        
        log.info("Request accepted successfully, conversation: {}", conversation.getId());
        return conversation;
    }
    
    @Transactional
    @Override
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
    
    @Transactional
    @Override
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
    
    @Transactional(readOnly = true)
    @Override
    public int getPendingRequestsCount(String userId) {
        return (int) messageRequestRepository.countByReceiverIdAndStatus(userId, RequestStatus.PENDING);
    }
    
    @Transactional
    @Override
    public void addPendingMessage(String requestId, Message message) {
        log.debug("Adding message to request: {}", requestId);
        
        MessageRequest request = getRequestById(requestId);
        
        if (request.getStatus() != RequestStatus.PENDING) {
            throw new BadRequestException("Can only add messages to pending requests");
        }
        
        if (request.getPendingMessageIds() == null) {
            request.setPendingMessageIds(new ArrayList<>());
        }
        request.getPendingMessageIds().add(message.getId());
        request.setLastMessageContent(resolvePreviewContent(message));
        request.setLastMessageTimestamp(message.getCreatedAt());
        messageRequestRepository.save(request);
    }
    
    @Transactional(readOnly = true)
    @Override
    public boolean hasActiveRequest(String senderId, String receiverId) {
        return messageRequestRepository.findBySenderIdAndReceiverIdAndStatus(
            senderId, 
            receiverId, 
            RequestStatus.PENDING
        ).isPresent();
    }
    
    @Transactional(readOnly = true)
    @Override
    public MessageRequest getRequestById(String requestId) {
        return messageRequestRepository.findById(requestId)
            .orElseThrow(() -> new ResourceNotFoundException("Message request not found with id: " + requestId));
    }
    
    @Transactional(readOnly = true)
    @Override
    public List<MessageDTO> getPendingMessages(String senderId, String receiverId) {
        log.info("Getting pending messages from {} to {}", senderId, receiverId);
        
        // Find pending message request between sender and receiver
        Optional<MessageRequest> requestOptional = messageRequestRepository.findBySenderIdAndReceiverIdAndStatus(
            senderId, 
            receiverId, 
            RequestStatus.PENDING
        );
        
        // If no request exists, return empty list
        if (requestOptional.isEmpty() || requestOptional.get().getPendingMessageIds() == null 
                || requestOptional.get().getPendingMessageIds().isEmpty()) {
            log.info("No pending messages found between {} and {}", senderId, receiverId);
            return new ArrayList<>();
        }
        
        MessageRequest request = requestOptional.get();
        List<String> pendingMessageIds = request.getPendingMessageIds();
        
        log.info("Found {} pending message IDs for request {}", pendingMessageIds.size(), request.getId());
        
        // Load all messages by IDs
        List<Message> messages = messageRepository.findByIdIn(pendingMessageIds);
        
        if (messages.isEmpty()) {
            log.warn("No messages found for pending message IDs: {}", pendingMessageIds);
            return new ArrayList<>();
        }
        
        log.info("Loaded {} pending messages", messages.size());
        
        // Sort messages by createdAt ascending (oldest first)
        messages.sort(Comparator.comparing(Message::getCreatedAt));
        
        // Map to DTOs
        List<MessageDTO> messageDTOs = messages.stream()
            .map(message -> messageMapper.toMessageDTO(message, senderId))
            .collect(Collectors.toList());
        
        log.info("Successfully mapped {} pending messages to DTOs", messageDTOs.size());
        
        return messageDTOs;
    }

    private String resolvePreviewContent(Message message) {
        return message.getContent() != null ? message.getContent() : "[Media]";
    }

    private Message linkPendingMessages(Conversation conversation, List<String> pendingMessageIds) {
        if (pendingMessageIds == null || pendingMessageIds.isEmpty()) {
            return null;
        }

        List<Message> messages = messageRepository.findByIdIn(pendingMessageIds);
        if (messages.isEmpty()) {
            log.warn("No persisted messages found for pending IDs: {}", pendingMessageIds);
            return null;
        }

        messages.sort(Comparator.comparing(Message::getCreatedAt));
        Message lastLinked = null;
        int attachedCount = 0;
        for (Message message : messages) {
            if (message.getConversation() != null) {
                if (!conversation.getId().equals(message.getConversation().getId())) {
                    log.warn("Message {} already linked to different conversation {}", message.getId(), message.getConversation().getId());
                }
                continue;
            }
            message.setConversation(conversation);
            messageRepository.save(message);
            lastLinked = message;
            attachedCount++;
        }

        if (attachedCount > 0) {
            log.info("Linked {} pending messages to conversation {}", attachedCount, conversation.getId());
        }
        return lastLinked;
    }
    
}

