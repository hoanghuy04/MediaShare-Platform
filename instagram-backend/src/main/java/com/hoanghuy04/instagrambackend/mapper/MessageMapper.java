package com.hoanghuy04.instagrambackend.mapper;

import com.hoanghuy04.instagrambackend.dto.response.ConversationDTO;
import com.hoanghuy04.instagrambackend.dto.response.MessageDTO;
import com.hoanghuy04.instagrambackend.dto.response.UserSummaryDTO;
import com.hoanghuy04.instagrambackend.entity.message.Message;
import com.hoanghuy04.instagrambackend.entity.User;
import com.hoanghuy04.instagrambackend.entity.message.Conversation;
import com.hoanghuy04.instagrambackend.repository.MessageRepository;
import com.hoanghuy04.instagrambackend.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.mapstruct.*;
import org.springframework.beans.factory.annotation.Autowired;

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
    public abstract ConversationDTO toConversationDTO(Conversation conversation, @Context String currentUserId);

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

