package com.hoanghuy04.instagrambackend.mapper;

import com.hoanghuy04.instagrambackend.dto.response.InboxItemResponse;
import com.hoanghuy04.instagrambackend.dto.request.MessageRequest;
import com.hoanghuy04.instagrambackend.entity.User;
import com.hoanghuy04.instagrambackend.enums.InboxItemType;
import com.hoanghuy04.instagrambackend.exception.ResourceNotFoundException;
import com.hoanghuy04.instagrambackend.repository.UserRepository;
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
@Mapper(componentModel = "spring", uses = MessageMapper.class, unmappedTargetPolicy = ReportingPolicy.IGNORE)
@Slf4j
public abstract class MessageRequestMapper {
    
    @Autowired
    protected UserRepository userRepository;

    @Autowired
    private UserMapper userMapper;

    /**
     * Map MessageRequest entity to MessageRequestDTO.
     * Uses MessageMapper for nested sender and firstMessage mappings.
     *
     * @param request the MessageRequest entity
     * @return MessageRequestDTO
     */
    public abstract MessageRequest toMessageRequestDTO(com.hoanghuy04.instagrambackend.entity.MessageRequest request);
    
    /**
     * Enrich MessageRequestDTO with nested sender and receiver.
     * Uses MessageMapper for the conversions with proper context.
     * NOTE: Must be called manually in service layer (MapStruct doesn't auto-call @AfterMapping in abstract classes)
     *
     * @param dto the target MessageRequestDTO
     * @param request the source MessageRequest entity
     */
    @AfterMapping
    public void enrichMessageRequest(@MappingTarget MessageRequest dto, com.hoanghuy04.instagrambackend.entity.MessageRequest request) {
        if (request == null) {
            return;
        }
        
        // Map sender: fetch from repository using senderId
        if (request.getSenderId() != null) {
            try {
                User sender = userRepository.findById(request.getSenderId())
                    .orElseThrow(() -> new ResourceNotFoundException("Sender not found: " + request.getSenderId()));
                dto.setSender(userMapper.toUserSummary(sender));
            } catch (Exception e) {
                log.warn("Failed to load sender for message request {}: {}", request.getId(), e.getMessage());
            }
        }
        
        // Map receiver: fetch from repository using receiverId
        if (request.getReceiverId() != null) {
            try {
                User receiver = userRepository.findById(request.getReceiverId())
                    .orElseThrow(() -> new ResourceNotFoundException("Receiver not found: " + request.getReceiverId()));
                dto.setReceiver(userMapper.toUserSummary(receiver));
            } catch (Exception e) {
                log.warn("Failed to load receiver for message request {}: {}", request.getId(), e.getMessage());
            }
        }
        
        // lastMessageContent and lastMessageTimestamp are already mapped by MapStruct
    }
    
    /**
     * Convert MessageRequest to InboxItemDTO.
     * Used for pending inbox items display.
     *
     * @param req the MessageRequest entity
     * @param viewerId the user ID viewing the inbox (for context)
     * @return InboxItemDTO with type MESSAGE_REQUEST
     */
    public InboxItemResponse toInboxItem(com.hoanghuy04.instagrambackend.entity.MessageRequest req, String viewerId) {
        if (req == null) {
            return null;
        }
        
        // Convert to MessageRequestDTO and enrich
        MessageRequest reqDTO = toMessageRequestDTO(req);
        enrichMessageRequest(reqDTO, req);
        
        // Determine timestamp: use lastMessageTimestamp if available, fallback to createdAt
        java.time.LocalDateTime timestamp = req.getLastMessageTimestamp() != null 
            ? req.getLastMessageTimestamp() 
            : req.getCreatedAt();
        
        return InboxItemResponse.builder()
            .type(InboxItemType.MESSAGE_REQUEST)
            .messageRequest(reqDTO)
            .timestamp(timestamp)
            .build();
    }
}

