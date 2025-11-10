package com.hoanghuy04.instagrambackend.mapper;

import com.hoanghuy04.instagrambackend.dto.response.ConversationDTO;
import com.hoanghuy04.instagrambackend.dto.response.LastMessageDTO;
import com.hoanghuy04.instagrambackend.dto.response.MessageDTO;
import com.hoanghuy04.instagrambackend.dto.response.UserSummaryDTO;
import com.hoanghuy04.instagrambackend.entity.Message;
import com.hoanghuy04.instagrambackend.entity.User;
import com.hoanghuy04.instagrambackend.entity.message.Conversation;
import com.hoanghuy04.instagrambackend.entity.message.LastMessageInfo;
import com.hoanghuy04.instagrambackend.exception.ResourceNotFoundException;
import com.hoanghuy04.instagrambackend.repository.MessageRepository;
import com.hoanghuy04.instagrambackend.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.mapstruct.*;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;
import java.util.stream.Collectors;

/**
 * MapStruct mapper for Message and Conversation entities to DTOs.
 * Handles complex nested mappings with proper null safety and logging.
 * 
 * @author Instagram Backend Team
 * @version 2.0.0
 */
@Mapper(componentModel = "spring")
@Slf4j
public abstract class MessageMapper {
    
    @Autowired
    protected UserRepository userRepository;
    
    @Autowired
    protected MessageRepository messageRepository;
    
    /**
     * Map User entity to UserSummaryDTO.
     *
     * @param user the User entity
     * @return UserSummaryDTO
     */
    @Mapping(target = "avatar", expression = "java(getAvatar(user))")
    @Mapping(target = "isVerified", source = "verified")
    public abstract UserSummaryDTO toUserSummaryDTO(User user);
    
    /**
     * Map Message entity to MessageDTO.
     * Context parameter currentUserId is used to determine if message is deleted by the user.
     *
     * @param message the Message entity
     * @param currentUserId the current user ID for context
     * @return MessageDTO
     */
    @Mapping(target = "conversationId", expression = "java(getConversationId(message))")
    @Mapping(target = "sender", ignore = true)
    @Mapping(target = "replyTo", ignore = true)
    @Mapping(target = "isDeleted", expression = "java(message.getDeletedBy().contains(currentUserId))")
    @Mapping(target = "readBy", expression = "java(new java.util.ArrayList<>(message.getReadBy()))")
    public abstract MessageDTO toMessageDTO(Message message, @Context String currentUserId);

    /**
     * Map Conversation entity to ConversationDTO.
     * Context parameter currentUserId is used for context-specific operations.
     *
     * @param conversation the Conversation entity
     * @param currentUserId the current user ID for context
     * @return ConversationDTO
     */
    @Mapping(target = "participants", ignore = true)
    @Mapping(target = "lastMessage", ignore = true)
    public abstract ConversationDTO toConversationDTO(Conversation conversation, @Context String currentUserId);

    /**
     * Enrich MessageDTO with sender and reply-to message.
     * Handles nested mappings and null safety.
     *
     * @param dto the target MessageDTO
     * @param message the source Message entity
     * @param currentUserId the current user ID for context
     */
    @AfterMapping
    protected void enrichMessage(@MappingTarget MessageDTO dto, Message message, @Context String currentUserId) {
        if (message == null) {
            return;
        }
        
        // Map sender
        if (message.getSender() != null) {
            try {
                dto.setSender(toUserSummaryDTO(message.getSender()));
            } catch (Exception e) {
                log.warn("Failed to load sender for message {}: {}", message.getId(), e.getMessage());
            }
        }
        
        // Map reply-to message (nested)
        if (message.getReplyToMessageId() != null) {
            try {
                Message replyToMessage = messageRepository.findById(message.getReplyToMessageId())
                    .orElseThrow(() -> new ResourceNotFoundException("Reply-to message not found"));
                
                // Create lightweight DTO for reply-to message
                MessageDTO replyTo = MessageDTO.builder()
                    .id(replyToMessage.getId())
                    .content(replyToMessage.getContent())
                    .createdAt(replyToMessage.getCreatedAt())
                    .build();
                
                // Map sender of reply-to message
                if (replyToMessage.getSender() != null) {
                    replyTo.setSender(UserSummaryDTO.builder()
                        .id(replyToMessage.getSender().getId())
                        .username(replyToMessage.getSender().getUsername())
                        .build());
                }
                
                dto.setReplyTo(replyTo);
            } catch (Exception e) {
                log.warn("Failed to load reply-to message {}: {}", message.getReplyToMessageId(), e.getMessage());
            }
        }
    }
    
    /**
     * Enrich ConversationDTO with participants and last message.
     * Handles complex nested mappings and null safety.
     *
     * @param dto the target ConversationDTO
     * @param conversation the source Conversation entity
     * @param currentUserId the current user ID for context
     */
    @AfterMapping
    protected void enrichConversation(@MappingTarget ConversationDTO dto, Conversation conversation, @Context String currentUserId) {
        if (conversation == null) {
            return;
        }
        
        // Map participants
        List<UserSummaryDTO> participants = conversation.getParticipants().stream()
            .map(userId -> {
                try {
                    User user = userRepository.findById(userId)
                        .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
                    return toUserSummaryDTO(user);
                } catch (Exception e) {
                    log.warn("Failed to load user {}: {}", userId, e.getMessage());
                    return null;
                }
            })
            .filter(user -> user != null)
            .collect(Collectors.toList());
        
        dto.setParticipants(participants);
        
        // Map last message
        if (conversation.getLastMessage() != null) {
            try {
                LastMessageInfo lastMessageInfo = conversation.getLastMessage();
                User sender = userRepository.findById(lastMessageInfo.getSenderId())
                    .orElseThrow(() -> new ResourceNotFoundException("Sender not found"));
                
                LastMessageDTO lastMessageDTO = LastMessageDTO.builder()
                    .messageId(lastMessageInfo.getMessageId())
                    .content(lastMessageInfo.getContent())
                    .senderId(lastMessageInfo.getSenderId())
                    .senderUsername(sender.getUsername())
                    .timestamp(lastMessageInfo.getTimestamp())
                    .build();
                
                dto.setLastMessage(lastMessageDTO);
            } catch (Exception e) {
                log.warn("Failed to load last message sender: {}", e.getMessage());
            }
        }
    }
    
    /**
     * Helper method to extract avatar URL from User.
     * Null-safe extraction of avatar from user profile.
     *
     * @param user the User entity
     * @return avatar URL or null
     */
    protected String getAvatar(User user) {
        if (user == null || user.getProfile() == null) {
            return null;
        }
        return user.getProfile().getAvatar();
    }
    
    /**
     * Helper method to extract conversation ID from Message.
     * Null-safe extraction of conversation ID.
     *
     * @param message the Message entity
     * @return conversation ID or null
     */
    protected String getConversationId(Message message) {
        if (message == null || message.getConversation() == null) {
            return null;
        }
        return message.getConversation().getId();
    }
}

