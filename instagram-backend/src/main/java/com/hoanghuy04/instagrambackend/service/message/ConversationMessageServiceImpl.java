package com.hoanghuy04.instagrambackend.service.message;

import com.hoanghuy04.instagrambackend.dto.response.ConversationDTO;
import com.hoanghuy04.instagrambackend.dto.response.MessageDTO;
import com.hoanghuy04.instagrambackend.dto.response.PageResponse;
import com.hoanghuy04.instagrambackend.entity.Message;
import com.hoanghuy04.instagrambackend.entity.User;
import com.hoanghuy04.instagrambackend.entity.message.Conversation;
import com.hoanghuy04.instagrambackend.entity.message.MessageRequest;
import com.hoanghuy04.instagrambackend.enums.ConversationType;
import com.hoanghuy04.instagrambackend.enums.RequestStatus;
import com.hoanghuy04.instagrambackend.exception.BadRequestException;
import com.hoanghuy04.instagrambackend.exception.ResourceNotFoundException;
import com.hoanghuy04.instagrambackend.mapper.MessageMapper;
import com.hoanghuy04.instagrambackend.repository.FollowRepository;
import com.hoanghuy04.instagrambackend.repository.MessageRepository;
import com.hoanghuy04.instagrambackend.repository.message.ConversationRepository;
import com.hoanghuy04.instagrambackend.repository.message.MessageRequestRepository;
import com.hoanghuy04.instagrambackend.service.user.UserService;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
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
    
    @Transactional
    @Override
    public Message sendMessageToConversation(String conversationId, String senderId, String content, String mediaUrl) {
        log.info("Sending message to conversation {} by user {}", conversationId, senderId);
        
        if (!conversationService.isParticipant(conversationId, senderId)) {
            throw new BadRequestException("You are not a participant in this conversation");
        }
        
        Conversation conversation = conversationService.getConversationById(conversationId);
        User sender = userService.getUserEntityById(senderId);
        autoMarkMessagesAsReadOnReply(conversationId, senderId);
        
        Message message = Message.builder()
            .conversation(conversation)
            .sender(sender)
            .receiver(null) 
            .content(content)
            .mediaUrl(mediaUrl)
            .build();
        
        if (conversation.getType() == ConversationType.DIRECT) {
            String otherParticipantId = conversation.getParticipants().stream()
                .filter(id -> !id.equals(senderId))
                .findFirst()
                .orElse(null);
            
            if (otherParticipantId != null) {
                User receiver = userService.getUserEntityById(otherParticipantId);
                message.setReceiver(receiver);
            }
        }
        
        message = messageRepository.save(message);
        conversationService.updateLastMessage(conversationId, message);
        
        log.info("Message sent successfully: {}", message.getId());
        return message;
    }
    
    @Transactional
    @Override
    public Message sendMessage(String senderId, String receiverId, String content, String mediaUrl) {
        log.info("Sending message from {} to {}", senderId, receiverId);
        
        User sender = userService.getUserEntityById(senderId);
        User receiver = userService.getUserEntityById(receiverId);
        
        boolean areConnected = areUsersConnected(senderId, receiverId);
        
        if (areConnected) {
            Conversation conversation = conversationService.getOrCreateDirectConversation(senderId, receiverId);
            return sendMessageToConversation(conversation.getId(), senderId, content, mediaUrl);
        } else {
            Optional<MessageRequest> incomingRequest = messageRequestRepository.findBySenderIdAndReceiverIdAndStatus(
                receiverId, senderId, RequestStatus.PENDING
            );
            
            if (incomingRequest.isPresent()) {
                log.info("Auto-accepting message request from {} to {}", receiverId, senderId);
                
                MessageRequest request = incomingRequest.get();
                messageRequestService.acceptRequest(request.getId(), senderId);
                
                Conversation conversation = conversationService.getOrCreateDirectConversation(senderId, receiverId);
                return sendMessageToConversation(conversation.getId(), senderId, content, mediaUrl);
            }
            
            Message message = Message.builder()
                .conversation(null)
                .sender(sender)
                .receiver(receiver)
                .content(content)
                .mediaUrl(mediaUrl)
                .build();
            
            message = messageRepository.save(message);
            messageRequestService.createMessageRequest(senderId, receiverId, message);
            
            log.info("Message sent via request: {}", message.getId());
            return message;
        }
    }
    
    @Transactional(readOnly = true)
    @Override
    public PageResponse<MessageDTO> getConversationMessagesAsDTO(String conversationId, String userId, Pageable pageable) {
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
        
        List<MessageDTO> messageDTOs = messages.stream()
            .map((Message message) -> messageMapper.toMessageDTO(message, userId))
            .collect(Collectors.toList());
        
        List<Message> allMessages = messageRepository
            .findByConversationIdAndDeletedByNotContainingOrderByCreatedAtDesc(
                conversationId, 
                userId,
                Pageable.unpaged()
            );
        
        Page<MessageDTO> page = new org.springframework.data.domain.PageImpl<>(messageDTOs, pageable, allMessages.size());
        return PageResponse.of(page);
    }
    
    @Transactional
    @Override
    public void markAsRead(String messageId, String userId) {
        log.info("Marking message {} as read by user {}", messageId, userId);
        
        Message message = getMessageById(messageId);
        
        if (!message.getReadBy().contains(userId)) {
            message.getReadBy().add(userId);
            messageRepository.save(message);
        }
        
        if (message.getConversation() != null) {
            Pageable unpaged = Pageable.unpaged();
            List<Message> unreadMessages = messageRepository
                .findByConversationIdAndDeletedByNotContainingOrderByCreatedAtDesc(
                    message.getConversation().getId(), 
                    userId,
                    unpaged
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
        
        webSocketMessageService.pushReadReceipt(message, userId);
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
        
        Conversation conversation = conversationService.getConversationById(conversationId);
        
        if (!conversation.getParticipants().contains(userId)) {
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
    public Message replyToMessage(String conversationId, String senderId, String replyToMessageId, String content) {
        log.info("Replying to message {} in conversation {} by user {}", replyToMessageId, conversationId, senderId);
        
        if (!conversationService.isParticipant(conversationId, senderId)) {
            throw new BadRequestException("You are not a participant in this conversation");
        }
        
        Message replyToMessage = getMessageById(replyToMessageId);
        
        if (!replyToMessage.getConversation().getId().equals(conversationId)) {
            throw new BadRequestException("Reply-to message is not in this conversation");
        }
        
        User sender = userService.getUserEntityById(senderId);
        Conversation conversation = conversationService.getConversationById(conversationId);
        
        Message message = Message.builder()
            .conversation(conversation)
            .sender(sender)
            .content(content)
            .replyToMessageId(replyToMessageId)
            .build();
        
        message = messageRepository.save(message);
        conversationService.updateLastMessage(conversationId, message);
        
        log.info("Reply sent successfully: {}", message.getId());
        return message;
    }
    
    @Transactional(readOnly = true)
    @Override
    public boolean areUsersConnected(String userId1, String userId2) {
        boolean user1FollowsUser2 = followRepository.existsByFollowerIdAndFollowingId(userId1, userId2);
        boolean user2FollowsUser1 = followRepository.existsByFollowerIdAndFollowingId(userId2, userId1);
        boolean followingEachOther = user1FollowsUser2 && user2FollowsUser1;
        
        if (followingEachOther) {
            return true;
        }
        
        List<String> participants = new ArrayList<>();
        participants.add(userId1);
        participants.add(userId2);
        Collections.sort(participants);
        
        Optional<Conversation> existingConversation = conversationRepository.findByTypeAndParticipants(
            ConversationType.DIRECT, participants, 2
        );
        
        boolean hasConversation = existingConversation.isPresent();
        
        if (hasConversation) {
            log.debug("Users {} and {} have existing conversation - considered connected", userId1, userId2);
        }
        
        return followingEachOther || hasConversation;
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
                    webSocketMessageService.pushReadReceipt(msg, userId);
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
    
    @Transactional(readOnly = true)
    @Override
    public PageResponse<ConversationDTO> getUserConversationsAsDTO(String userId, Pageable pageable) {
        log.debug("Getting conversations for user: {} with pagination", userId);
        
        List<Conversation> conversations = conversationService.getUserConversations(userId);
        
        List<ConversationDTO> conversationDTOs = conversations.stream()
            .map(conv -> messageMapper.toConversationDTO(conv, userId))
            .collect(Collectors.toList());
        
        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), conversationDTOs.size());
        List<ConversationDTO> paginatedConversations = start < conversationDTOs.size() 
            ? conversationDTOs.subList(start, end) 
            : new ArrayList<>();
        
        Page<ConversationDTO> page = new org.springframework.data.domain.PageImpl<>(
            paginatedConversations,
            pageable,
            conversationDTOs.size()
        );
        
        return PageResponse.of(page);
    }
    
    @Transactional(readOnly = true)
    @Override
    public ConversationDTO getConversationAsDTO(String conversationId, String userId) {
        log.debug("Getting conversation details: {} for user: {}", conversationId, userId);
        
        if (!conversationService.isParticipant(conversationId, userId)) {
            throw new BadRequestException("You are not a participant in this conversation");
        }
        
        Conversation conversation = conversationService.getConversationById(conversationId);
        return messageMapper.toConversationDTO(conversation, userId);
    }
    
    @Transactional
    @Override
    public ConversationDTO createGroupAndConvertToDTO(
            String creatorId,
            List<String> participantIds,
            String groupName,
            String avatar) {
        Conversation conversation = conversationService.createGroupConversation(
            creatorId, participantIds, groupName, avatar
        );
        return messageMapper.toConversationDTO(conversation, creatorId);
    }
    
    @Transactional
    @Override
    public ConversationDTO updateGroupAndConvertToDTO(
            String conversationId,
            String name,
            String avatar,
            String userId) {
        Conversation conversation = conversationService.updateGroupInfo(conversationId, name, avatar);
        return messageMapper.toConversationDTO(conversation, userId);
    }
}
