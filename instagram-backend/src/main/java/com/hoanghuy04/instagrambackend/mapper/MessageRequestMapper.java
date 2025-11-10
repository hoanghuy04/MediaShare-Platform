package com.hoanghuy04.instagrambackend.mapper;

import com.hoanghuy04.instagrambackend.dto.response.MessageRequestDTO;
import com.hoanghuy04.instagrambackend.entity.message.MessageRequest;
import lombok.extern.slf4j.Slf4j;
import org.mapstruct.*;
import org.springframework.beans.factory.annotation.Autowired;

/**
 * MapStruct mapper for MessageRequest entity to DTO.
 * Delegates nested User and Message mappings to MessageMapper.
 * 
 * @author Instagram Backend Team
 * @version 2.0.0
 */
@Mapper(componentModel = "spring", uses = MessageMapper.class)
@Slf4j
public abstract class MessageRequestMapper {
    
    @Autowired
    protected MessageMapper messageMapper;
    
    /**
     * Map MessageRequest entity to MessageRequestDTO.
     * Uses MessageMapper for nested sender and firstMessage mappings.
     *
     * @param request the MessageRequest entity
     * @return MessageRequestDTO
     */
    @Mapping(target = "sender", ignore = true)
    @Mapping(target = "firstMessage", ignore = true)
    public abstract MessageRequestDTO toMessageRequestDTO(MessageRequest request);
    
    /**
     * Enrich MessageRequestDTO with nested sender and firstMessage.
     * Uses MessageMapper for the conversions with proper context.
     *
     * @param dto the target MessageRequestDTO
     * @param request the source MessageRequest entity
     */
    @AfterMapping
    protected void enrichMessageRequest(@MappingTarget MessageRequestDTO dto, MessageRequest request) {
        if (request == null) {
            return;
        }
        
        // Map sender using MessageMapper
        if (request.getSender() != null) {
            try {
                dto.setSender(messageMapper.toUserSummaryDTO(request.getSender()));
            } catch (Exception e) {
                log.warn("Failed to load sender for message request {}: {}", request.getId(), e.getMessage());
            }
        }
        
        // Map first message using MessageMapper with receiver context
        if (request.getFirstMessage() != null && request.getReceiver() != null) {
            try {
                String receiverId = request.getReceiver().getId();
                dto.setFirstMessage(messageMapper.toMessageDTO(request.getFirstMessage(), receiverId));
            } catch (Exception e) {
                log.warn("Failed to load first message for message request {}: {}", request.getId(), e.getMessage());
            }
        }
    }
}

