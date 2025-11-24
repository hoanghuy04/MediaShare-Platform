package com.hoanghuy04.instagrambackend.service.messagerequest;

import com.hoanghuy04.instagrambackend.dto.response.InboxItemResponse;
import com.hoanghuy04.instagrambackend.dto.response.MessageResponse;
import com.hoanghuy04.instagrambackend.dto.request.MessageRequest;
import com.hoanghuy04.instagrambackend.dto.response.PageResponse;
import com.hoanghuy04.instagrambackend.entity.Message;
import com.hoanghuy04.instagrambackend.entity.Conversation;
import com.hoanghuy04.instagrambackend.enums.MessageType;
import com.hoanghuy04.instagrambackend.enums.RequestStatus;
import com.hoanghuy04.instagrambackend.exception.BadRequestException;
import com.hoanghuy04.instagrambackend.exception.ResourceNotFoundException;
import com.hoanghuy04.instagrambackend.mapper.MessageMapper;
import com.hoanghuy04.instagrambackend.mapper.MessageRequestMapper;
import com.hoanghuy04.instagrambackend.repository.MessageRepository;
import com.hoanghuy04.instagrambackend.repository.MessageRequestRepository;
import com.hoanghuy04.instagrambackend.service.conversation.ConversationService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
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
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class MessageRequestServiceImpl implements MessageRequestService {
    
    MessageRequestRepository messageRequestRepository;
    ConversationService conversationService;
    MessageRepository messageRepository;
    MessageRequestMapper messageRequestMapper;
    MessageMapper messageMapper;
    
    @Transactional
    @Override
    public com.hoanghuy04.instagrambackend.entity.MessageRequest createMessageRequest(String senderId, String receiverId, Message firstMessage) {
        log.info("Creating message request from {} to {}", senderId, receiverId);
        
        // Check if request already exists
        Optional<com.hoanghuy04.instagrambackend.entity.MessageRequest> existing = messageRequestRepository.findBySenderIdAndReceiverIdAndStatus(
            senderId, 
            receiverId, 
            RequestStatus.PENDING
        );
        
        if (existing.isPresent()) {
            // Add message to existing request
            com.hoanghuy04.instagrambackend.entity.MessageRequest request = existing.get();
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
        com.hoanghuy04.instagrambackend.entity.MessageRequest request = com.hoanghuy04.instagrambackend.entity.MessageRequest.builder()
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
    public List<MessageRequest> getPendingRequests(String userId) {
        log.debug("Getting pending requests for user: {}", userId);
        
        List<com.hoanghuy04.instagrambackend.entity.MessageRequest> requests = messageRequestRepository.findByReceiverIdAndStatusOrderByCreatedAtDesc(
            userId, 
            RequestStatus.PENDING
        );
        
        return requests.stream()
            .map(messageRequestMapper::toMessageRequestDTO)
            .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    @Override
    public PageResponse<InboxItemResponse> getPendingInboxItems(String userId, Pageable pageable) {
        log.debug("Getting pending inbox items for user: {} with page {} and size {}", 
            userId, pageable.getPageNumber(), pageable.getPageSize());
        
        // Query received requests (others sent to this user)
        List<com.hoanghuy04.instagrambackend.entity.MessageRequest> requests = messageRequestRepository.findByReceiverIdAndStatusOrderByCreatedAtDesc(
            userId, 
            RequestStatus.PENDING
        );
        
        // Convert to InboxItemDTO
        List<InboxItemResponse> allInboxItems = requests.stream()
            .map(req -> messageRequestMapper.toInboxItem(req, userId))
            .collect(Collectors.toList());
        
        // Sort by timestamp (lastMessageTimestamp or createdAt) - most recent first
        // Note: Repository already sorts by createdAt DESC, but we need to sort by lastMessageTimestamp
        allInboxItems.sort((a, b) -> {
            LocalDateTime timeA = a.getTimestamp();
            LocalDateTime timeB = b.getTimestamp();
            if (timeA == null && timeB == null) return 0;
            if (timeA == null) return 1;
            if (timeB == null) return -1;
            return timeB.compareTo(timeA); // Descending order (most recent first)
        });
        
        // Apply pagination
        int totalElements = allInboxItems.size();
        int pageNumber = pageable.getPageNumber();
        int pageSize = pageable.getPageSize();
        int startIndex = pageNumber * pageSize;
        int endIndex = Math.min(startIndex + pageSize, totalElements);
        
        List<InboxItemResponse> pageContent = (startIndex < totalElements)
            ? allInboxItems.subList(startIndex, endIndex) 
            : new ArrayList<>();
        
        int totalPages = (int) Math.ceil((double) totalElements / pageSize);
        boolean hasNext = pageNumber < (totalPages - 1);
        boolean hasPrevious = pageNumber > 0;
        boolean isFirst = pageNumber == 0;
        boolean isLast = pageNumber >= (totalPages - 1);
        boolean isEmpty = pageContent.isEmpty();
        
        log.debug("Found {} total pending inbox items for user {}. Returning page {} with {} items", 
            totalElements, userId, pageNumber, pageContent.size());
        
        return PageResponse.<InboxItemResponse>builder()
            .content(pageContent)
            .pageNumber(pageNumber)
            .pageSize(pageSize)
            .totalElements(totalElements)
            .totalPages(totalPages)
            .hasNext(hasNext)
            .hasPrevious(hasPrevious)
            .first(isFirst)
            .last(isLast)
            .empty(isEmpty)
            .build();
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
        
        com.hoanghuy04.instagrambackend.entity.MessageRequest request = getRequestById(requestId);
        
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
    public com.hoanghuy04.instagrambackend.entity.MessageRequest getRequestById(String requestId) {
        return messageRequestRepository.findById(requestId)
            .orElseThrow(() -> new ResourceNotFoundException("Message request not found with id: " + requestId));
    }
    
    @Transactional(readOnly = true)
    @Override
    public List<MessageResponse> getPendingMessages(String senderId, String receiverId) {
        log.info("Getting pending messages from {} to {}", senderId, receiverId);
        
        // Find pending message request between sender and receiver
        Optional<com.hoanghuy04.instagrambackend.entity.MessageRequest> requestOptional = messageRequestRepository.findBySenderIdAndReceiverIdAndStatus(
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
        
        com.hoanghuy04.instagrambackend.entity.MessageRequest request = requestOptional.get();
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
        List<MessageResponse> messageResponses = messages.stream()
            .map(message -> messageMapper.toMessageDTO(message))
            .collect(Collectors.toList());
        
        log.info("Successfully mapped {} pending messages to DTOs", messageResponses.size());
        
        return messageResponses;
    }
    
    @Transactional(readOnly = true)
    @Override
    public List<MessageResponse> getPendingMessagesByRequestId(String requestId, String viewerId) {
        log.info("Getting pending messages for request {} by viewer {}", requestId, viewerId);
        
        com.hoanghuy04.instagrambackend.entity.MessageRequest request = getRequestById(requestId);
        
        // Verify viewer is either sender or receiver
        if (!request.getSenderId().equals(viewerId) && !request.getReceiverId().equals(viewerId)) {
            throw new BadRequestException("You can only view pending messages for your own requests");
        }
        
        // Use senderId and receiverId from the request
        return getPendingMessages(request.getSenderId(), request.getReceiverId());
    }

    /**
     * Build human-readable preview text for a message based on its type.
     * Used for message request previews.
     */
    private String resolvePreviewContent(Message message) {
        if (message == null || message.getType() == null) {
            return "[Message]";
        }
        
        return switch (message.getType()) {
            case TEXT -> message.getContent() != null ? message.getContent() : "";
            case IMAGE -> "Đã gửi một ảnh";
            case VIDEO -> "Đã gửi một video";
            case AUDIO -> "Đã gửi một tin nhắn thoại";
            case POST_SHARE -> "Đã chia sẻ một bài viết";
        };
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

