package com.hoanghuy04.instagrambackend.service.conversation;

import com.hoanghuy04.instagrambackend.dto.request.MessageRequest;
import com.hoanghuy04.instagrambackend.dto.response.*;
import com.hoanghuy04.instagrambackend.entity.Message;
import com.hoanghuy04.instagrambackend.entity.User;
import com.hoanghuy04.instagrambackend.entity.Conversation;
import com.hoanghuy04.instagrambackend.entity.UserProfile;
import com.hoanghuy04.instagrambackend.entity.conversation.ConversationMember;
import com.hoanghuy04.instagrambackend.enums.ConversationType;
import com.hoanghuy04.instagrambackend.enums.InboxItemType;
import com.hoanghuy04.instagrambackend.enums.MessageType;
import com.hoanghuy04.instagrambackend.enums.RequestStatus;
import com.hoanghuy04.instagrambackend.exception.BadRequestException;
import com.hoanghuy04.instagrambackend.exception.ResourceNotFoundException;
import com.hoanghuy04.instagrambackend.mapper.MessageMapper;
import com.hoanghuy04.instagrambackend.mapper.MessageRequestMapper;
import com.hoanghuy04.instagrambackend.mapper.UserMapper;
import com.hoanghuy04.instagrambackend.repository.FollowRepository;
import com.hoanghuy04.instagrambackend.repository.MessageRepository;
import com.hoanghuy04.instagrambackend.repository.ConversationRepository;
import com.hoanghuy04.instagrambackend.repository.MessageRequestRepository;
import com.hoanghuy04.instagrambackend.service.FileService;
import com.hoanghuy04.instagrambackend.service.messagerequest.MessageRequestService;
import com.hoanghuy04.instagrambackend.service.user.UserService;
import com.hoanghuy04.instagrambackend.service.websocket.WebSocketMessageService;
import com.hoanghuy04.instagrambackend.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Service class for conversation-based message operations.
 * Handles sending, reading, and managing messages within conversations.
 *
 * @author Instagram Backend Team
 * @version 2.0.0
 */
@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class ConversationMessageServiceImpl implements ConversationMessageService {

    MessageRequestService messageRequestService;
    ConversationService conversationService;
    UserService userService;
    WebSocketMessageService webSocketMessageService;

    MessageRepository messageRepository;
    MessageRequestRepository messageRequestRepository;
    ConversationRepository conversationRepository;
    FollowRepository followRepository;

    MessageMapper messageMapper;
    MessageRequestMapper messageRequestMapper;

    FileService fileService;
    UserMapper userMapper;
    SecurityUtil securityUtil;

    @Transactional
    @Override
    public MessageResponse sendMessageToConversation(String conversationId, String senderId, com.hoanghuy04.instagrambackend.enums.MessageType type, String content) {
        log.info("Sending message to conversation {} by user {} with type {}", conversationId, senderId, type);

        if (!conversationService.isParticipant(conversationId, senderId)) {
            throw new BadRequestException("You are not a participant in this conversation");
        }

        Conversation conversation = conversationRepository.findById(conversationId).orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));
        User sender = userService.getUserEntityById(senderId);
        autoMarkMessagesAsReadOnReply(conversationId, senderId);

        Message message = Message.builder()
                .conversation(conversation)
                .sender(sender)
                .receiver(null)
                .type(type)
                .content(content)
                .build();

        if (conversation.getType() == ConversationType.DIRECT) {
            String otherParticipantId = conversation.getParticipants().stream()
                    .map(p -> p.getUserId())
                    .filter(id -> !id.equals(senderId))
                    .findFirst()
                    .orElse(null);

            if (otherParticipantId != null) {
                User receiver = userService.getUserEntityById(otherParticipantId);
                message.setReceiver(receiver);
            }
        }

        message = messageRepository.save(message);
        MessageResponse messageResponse = messageMapper.toMessageDTO(message);
        conversationService.updateLastMessage(conversationId, messageResponse);

        log.info("Message sent successfully: {}", message.getId());
        return messageResponse;
    }

    @Transactional
    @Override
    public MessageResponse sendMessage(String senderId, String receiverId, com.hoanghuy04.instagrambackend.enums.MessageType type, String content) {
        log.info("Sending message from {} to {} with type {}", senderId, receiverId, type);

        User sender = userService.getUserEntityById(senderId);
        User receiver = userService.getUserEntityById(receiverId);

        ConversationResponse existingConversation = conversationService.getExistingDirectConversation(senderId, receiverId);
        if (existingConversation != null) {
            return sendMessageToConversation(existingConversation.getId(), senderId, type, content);
        }

        boolean mutualFollow = isMutualFollow(senderId, receiverId);
        if (mutualFollow) {
            ConversationResponse conversation = conversationService.createDirectConversation(senderId, receiverId);
            return sendMessageToConversation(conversation.getId(), senderId, type, content);
        }

        Optional<com.hoanghuy04.instagrambackend.entity.MessageRequest> incomingRequest = messageRequestRepository.findBySenderIdAndReceiverIdAndStatus(
                receiverId, senderId, RequestStatus.PENDING
        );

        if (incomingRequest.isPresent()) {
            com.hoanghuy04.instagrambackend.entity.MessageRequest request = incomingRequest.get();
            log.info("Auto-accepting pending request {} when {} replies to {}", request.getId(), senderId, receiverId);

            request.setStatus(RequestStatus.ACCEPTED);
            request.setRespondedAt(LocalDateTime.now());

            ConversationResponse conversation = conversationService
                    .getExistingDirectConversation(senderId, receiverId);

            if (conversation == null) {
                conversation = conversationService.createDirectConversation(senderId, receiverId);
            }
            List<Message> pendingMessages1 = messageRepository.findBySenderAndReceiverOrderByCreatedAtDesc(sender, receiver);
            List<Message> pendingMessages2 = messageRepository.findBySenderAndReceiverOrderByCreatedAtDesc(receiver, sender);

            List<Message> allPendingMessages = new ArrayList<>();
            allPendingMessages.addAll(pendingMessages1);
            allPendingMessages.addAll(pendingMessages2);

            List<Message> messagesToMigrate = allPendingMessages.stream()
                    .filter(msg -> msg.getConversation() == null)
                    .collect(Collectors.toList());

            for (Message msg : messagesToMigrate) {
                msg.setConversation(messageMapper.toConversationEntity(conversation));
                messageRepository.save(msg);
            }

            if (!messagesToMigrate.isEmpty()) {
                log.info("Migrated {} pending messages to conversation {}", messagesToMigrate.size(), conversation.getId());
            }

            // Link pending messages from request.pendingMessageIds (if any)
            if (request.getPendingMessageIds() != null && !request.getPendingMessageIds().isEmpty()) {
                List<Message> requestMessages = messageRepository.findByIdIn(request.getPendingMessageIds());
                for (Message msg : requestMessages) {
                    if (msg.getConversation() == null) {
                        msg.setConversation(messageMapper.toConversationEntity(conversation));
                        messageRepository.save(msg);
                    }
                }
            }
            request.setPendingMessageIds(new ArrayList<>());
            messageRequestRepository.save(request);

            MessageResponse replyMessage = sendMessageToConversation(conversation.getId(), senderId, type, content);

            conversationService.updateLastMessage(conversation.getId(), replyMessage);

            log.info("Auto-accepted request {} and migrated messages to conversation {}", request.getId(), conversation.getId());
            return replyMessage;
        }

        Message message = Message.builder()
                .conversation(null)
                .sender(sender)
                .receiver(receiver)
                .type(type)
                .content(content)
                .build();

        message = messageRepository.save(message);
        messageRequestService.createMessageRequest(senderId, receiverId, message);

        MessageResponse dto = messageMapper.toMessageDTO(message);
        webSocketMessageService.pushMessage(dto);


        if (dto.getSender() == null) {
            log.warn("Sender is null in DTO for message {}, manually setting from UserService", message.getId());
            try {
                User sender2 = userService.getUserEntityById(senderId);
                dto.setSender(userMapper.toUserSummary(sender2));
                log.info("Manually set sender {} for message {}", senderId, message.getId());
            } catch (Exception e) {
                log.error("Failed to manually set sender for message {}: {}", message.getId(), e.getMessage());
            }
        }

        log.info("Message sent via request: {}", message.getId());
        return dto;
    }

    @Transactional(readOnly = true)
    @Override
    public PageResponse<MessageResponse> getConversationMessagesAsDTO(String conversationId, String userId, Pageable pageable) {
        log.debug("Getting messages for conversation {} by user {}", conversationId, userId);

        if (!conversationService.isParticipant(conversationId, userId)) {
            throw new BadRequestException("You are not a participant in this conversation");
        }

        List<Message> messages = messageRepository
                .findByConversationIdAndDeletedByNotContainingOrderByCreatedAtDesc(
                        conversationId,
                        userId,
                        pageable
                );

        List<MessageResponse> messageResponses = messages.stream()
                .map((Message message) -> messageMapper.toMessageDTO(message))
                .collect(Collectors.toList());

        Page<MessageResponse> page = new org.springframework.data.domain.PageImpl<>(messageResponses, pageable, messageResponses.size());
        return PageResponse.of(page);
    }

    @Transactional
    @Override
    public void markAsRead(String messageId) {
        Message message = getMessageById(messageId);
        String userId = securityUtil.getCurrentUserId();

        if (!message.getReadBy().contains(userId)) {
            message.getReadBy().add(userId);
            messageRepository.save(message);
        }

        if (message.getConversation() != null) {
            List<Message> unreadMessages = messageRepository
                    .findByConversationId(
                            message.getConversation().getId()
                    );

            for (Message msg : unreadMessages) {
                if (!msg.getReadBy().contains(userId) && !msg.getSender().getId().equals(userId)) {
                    msg.getReadBy().add(userId);
                    messageRepository.save(msg);
                }
            }
        } else {
            User sender = message.getSender();
            User receiver = message.getReceiver();

            if (sender != null && receiver != null) {
                List<Message> unreadMessages = messageRepository
                        .findBySenderAndReceiverOrderByCreatedAtDesc(sender, receiver)
                        .stream()
                        .filter(msg -> msg.getReceiver() != null
                                && msg.getReceiver().getId().equals(userId)
                                && !msg.getReadBy().contains(userId))
                        .toList();

                for (Message msg : unreadMessages) {
                    msg.getReadBy().add(userId);
                    messageRepository.save(msg);
                }
            }
        }

        webSocketMessageService.pushReadReceipt(messageMapper.toMessageDTO(message), userId);
        log.info("Message marked as read successfully");
    }

    @Transactional
    @Override
    public void deleteMessageForUser(String messageId, String userId) {
        log.info("Deleting message {} for user {}", messageId, userId);

        Message message = getMessageById(messageId);

        if (!message.getDeletedBy().contains(userId)) {
            message.getDeletedBy().add(userId);
            message.setDeletedAt(LocalDateTime.now());
            messageRepository.save(message);
            log.info("Message deleted for user successfully");
        }
    }

    @Transactional
    @Override
    public void deleteConversationForUser(String conversationId, String userId) {
        log.info("Deleting conversation {} for user {}", conversationId, userId);

        Conversation conversation = conversationRepository.findById(conversationId).orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));

        boolean isParticipant = conversation.getParticipants().stream()
                .anyMatch(p -> p.getUserId().equals(userId));
        if (!isParticipant) {
            throw new BadRequestException("You are not a participant in this conversation");
        }

        if (!conversation.getDeletedBy().contains(userId)) {
            conversation.getDeletedBy().add(userId);
            conversationRepository.save(conversation);
            log.info("Conversation deleted for user successfully");
        } else {
            log.debug("Conversation already deleted for user");
        }
    }

    @Transactional
    @Override
    public MessageResponse replyToMessage(String conversationId, String senderId, String replyToMessageId, String content) {
        log.info("Replying to message {} in conversation {} by user {}", replyToMessageId, conversationId, senderId);

        if (!conversationService.isParticipant(conversationId, senderId)) {
            throw new BadRequestException("You are not a participant in this conversation");
        }

        Message replyToMessage = getMessageById(replyToMessageId);

        if (!replyToMessage.getConversation().getId().equals(conversationId)) {
            throw new BadRequestException("Reply-to message is not in this conversation");
        }

        User sender = userService.getUserEntityById(senderId);
        Conversation conversation = conversationRepository.findById(conversationId).orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));

        Message message = Message.builder()
                .conversation(conversation)
                .sender(sender)
                .type(com.hoanghuy04.instagrambackend.enums.MessageType.TEXT) // Reply is always TEXT
                .content(content)
                .replyToMessageId(replyToMessageId)
                .build();

        message = messageRepository.save(message);
        MessageResponse messageResponse = messageMapper.toMessageDTO(message);
        conversationService.updateLastMessage(conversationId, messageResponse);

        log.info("Reply sent successfully: {}", message.getId());
        return messageResponse;
    }

    @Transactional(readOnly = true)
    @Override
    public boolean areUsersConnected(String userId1, String userId2) {
        boolean mutualFollow = isMutualFollow(userId1, userId2);
        if (mutualFollow) {
            return true;
        }
        boolean hasConversation = conversationService.getExistingDirectConversation(userId1, userId2) != null;
        if (hasConversation) {
            log.debug("Users {} and {} have existing conversation - considered connected", userId1, userId2);
        }
        return hasConversation;
    }

    private void autoMarkMessagesAsReadOnReply(String conversationId, String userId) {
        try {
            log.debug("Auto-marking messages as read for user {} in conversation {}", userId, conversationId);

            Pageable unpaged = Pageable.unpaged();
            List<Message> unreadMessages = messageRepository
                    .findByConversationIdAndDeletedByNotContainingOrderByCreatedAtDesc(
                            conversationId,
                            userId,
                            unpaged
                    );

            int markedCount = 0;
            for (Message msg : unreadMessages) {
                if (!msg.getSender().getId().equals(userId) && !msg.getReadBy().contains(userId)) {
                    msg.getReadBy().add(userId);
                    messageRepository.save(msg);
                    webSocketMessageService.pushReadReceipt(messageMapper.toMessageDTO(msg), userId);
                    markedCount++;
                }
            }

            if (markedCount > 0) {
                log.info("Auto-marked {} messages as read for user {} when replying", markedCount, userId);
            }
        } catch (Exception e) {
            log.warn("Failed to auto-mark messages as read: {}", e.getMessage());
        }
    }

    private Message getMessageById(String messageId) {
        return messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found with id: " + messageId));
    }

    private boolean isMutualFollow(String userId1, String userId2) {
        boolean user1FollowsUser2 = followRepository.existsByFollowerIdAndFollowingId(userId1, userId2);
        boolean user2FollowsUser1 = followRepository.existsByFollowerIdAndFollowingId(userId2, userId1);
        return user1FollowsUser2 && user2FollowsUser1;
    }

    @Transactional(readOnly = true)
    @Override
    public PageResponse<InboxItemResponse> getInboxItems(String userId, Pageable pageable) {
        log.debug("Getting inbox items for user: {} with page {} and size {}",
                userId, pageable.getPageNumber(), pageable.getPageSize());

        List<InboxItemResponse> allInboxItems = new ArrayList<>();

        // 1. Get all conversations
        List<ConversationResponse> conversations = conversationService.getUserConversations(userId);
        for (ConversationResponse conv : conversations) {
            MediaFileResponse mediaFileResponse = fileService.getMediaFileResponse(conv.getAvatar());
            if (mediaFileResponse != null) {
                conv.setAvatar(mediaFileResponse.getUrl());
            }

            InboxItemResponse item = InboxItemResponse.builder()
                    .type(InboxItemType.CONVERSATION)
                    .conversation(normalizeCon(conv))
                    .timestamp(conv.getLastMessage() != null ? conv.getLastMessage().getTimestamp() : conv.getCreatedAt())
                    .build();
            allInboxItems.add(item);
        }

        // 2. Get message requests sent by user (status=PENDING)
        List<com.hoanghuy04.instagrambackend.entity.MessageRequest> sentRequests = messageRequestRepository.findBySenderIdOrderByCreatedAtDesc(userId)
                .stream()
                .filter(req -> req.getStatus() == RequestStatus.PENDING)
                .collect(Collectors.toList());

        for (com.hoanghuy04.instagrambackend.entity.MessageRequest req : sentRequests) {
            MessageRequest reqDTO = messageRequestMapper.toMessageRequestDTO(req);

            InboxItemResponse item = InboxItemResponse.builder()
                    .type(InboxItemType.MESSAGE_REQUEST)
                    .messageRequest(reqDTO)
                    .timestamp(req.getCreatedAt())
                    .build();
            allInboxItems.add(item);
        }

        // 3. Sort by timestamp (most recent first)
        allInboxItems.sort((a, b) -> b.getTimestamp().compareTo(a.getTimestamp()));

        // 4. Apply pagination
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

        log.debug("Found {} total inbox items for user {}: {} conversations, {} message requests. Returning page {} with {} items",
                totalElements, userId, conversations.size(), sentRequests.size(), pageNumber, pageContent.size());

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
    public ConversationResponse getConversationAsDTO(String conversationId, String userId) {
        if (!conversationService.isParticipant(conversationId, userId)) {
            throw new BadRequestException("You are not a participant in this conversation");
        }
        Conversation conversation = conversationRepository.findById(conversationId).orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));
        ConversationResponse dto = messageMapper.toConversationDTO(conversation);

        // ✅ enrich avatarUrl
        if (conversation.getAvatar() != null && !conversation.getAvatar().startsWith("http")) {
            try {
                var media = fileService.getMediaFileResponse(conversation.getAvatar());
                dto.setAvatar(media.getUrl());
            } catch (Exception ignored) {
                dto.setAvatar(null);
            }
        }

        return normalizeCon(dto);
    }

    @Transactional
    @Override
    public ConversationResponse createGroupAndConvertToDTO(
            String creatorId,
            List<String> participantIds,
            String groupName) {
        return conversationService.createGroupConversation(
                creatorId, participantIds, groupName
        );
    }

    @Transactional
    @Override
    public ConversationResponse updateGroupAndConvertToDTO(
            String conversationId,
            String name,
            String avatar,
            String userId
    ) {
        // Ủy quyền cho conversationService xử lý quyền + resolve avatar
        return conversationService.updateGroupInfo(conversationId, name, avatar, userId);
    }

    private ConversationResponse normalizeCon(ConversationResponse convDto) {

        List<ConversationMember> members = convDto.getParticipants();
        for (ConversationMember member : members) {
            try {
                var avatarMedia = fileService.getMediaFileResponse(member.getAvatar());
                member.setAvatar(avatarMedia != null ? avatarMedia.getUrl() : null);
            } catch (Exception ignored) {
                member.setAvatar(null);
            }
        }
        convDto.setParticipants(members);

        return convDto;
    }

    /**
     * Build preview text for a message based on its type.
     * Used for lastMessage in conversations and message requests.
     *
     * @param message the message entity
     * @return human-readable preview text
     */
    private String buildPreviewText(Message message) {
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

    /**
     * Build preview text for a message response based on its type.
     * Used for lastMessage in conversations.
     *
     * @param messageResponse the message response DTO
     * @return human-readable preview text
     */
    private String buildPreviewText(MessageResponse messageResponse) {
        if (messageResponse == null || messageResponse.getType() == null) {
            return "[Message]";
        }
        
        return switch (messageResponse.getType()) {
            case TEXT -> messageResponse.getContent() != null ? messageResponse.getContent() : "";
            case IMAGE -> "Đã gửi một ảnh";
            case VIDEO -> "Đã gửi một video";
            case AUDIO -> "Đã gửi một tin nhắn thoại";
            case POST_SHARE -> "Đã chia sẻ một bài viết";
        };
    }

}
