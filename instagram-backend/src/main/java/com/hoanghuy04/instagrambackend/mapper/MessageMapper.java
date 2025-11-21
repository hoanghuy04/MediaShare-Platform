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

    /**
     * Map User entity to UserSummaryDTO.
     *
     * @param user the User entity
     * @return UserSummaryDTO
     */
    public abstract UserSummaryDTO toUserSummaryDTO(User user);
    
    /**
     * Map Message entity to MessageDTO.
     * Context parameter currentUserId is used to determine if message is deleted by the user.
     *
     * @param message the Message entity
     * @return MessageDTO
     */
//    @Mapping(target = "isDeleted", expression = "java(message.getDeletedBy().contains(currentUserId))")
    @Mapping(target = "readBy", expression = "java(new java.util.ArrayList<>(message.getReadBy()))")
    public abstract MessageDTO toMessageDTO(Message message);

    /**
     * Map Conversation entity to ConversationDTO.
     * Context parameter currentUserId is used for context-specific operations.
     *
     * @param conversation the Conversation entity
     * @return ConversationDTO
     */
    public abstract ConversationDTO toConversationDTO(Conversation conversation);

}

