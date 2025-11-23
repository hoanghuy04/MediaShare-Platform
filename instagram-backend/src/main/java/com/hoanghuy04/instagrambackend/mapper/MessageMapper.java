package com.hoanghuy04.instagrambackend.mapper;

import com.hoanghuy04.instagrambackend.dto.response.ConversationResponse;
import com.hoanghuy04.instagrambackend.dto.response.MessageResponse;
import com.hoanghuy04.instagrambackend.dto.response.UserSummaryResponse;
import com.hoanghuy04.instagrambackend.entity.Conversation;
import com.hoanghuy04.instagrambackend.entity.Message;
import com.hoanghuy04.instagrambackend.entity.User;
import com.hoanghuy04.instagrambackend.service.FileService;
import lombok.extern.slf4j.Slf4j;
import org.mapstruct.*;
import org.springframework.beans.factory.annotation.Autowired;

@Mapper(
        componentModel = "spring",
        unmappedTargetPolicy = ReportingPolicy.IGNORE,
        injectionStrategy = InjectionStrategy.FIELD
)
@Slf4j
public abstract class MessageMapper {

    @Autowired
    protected FileService fileService;
    @Autowired
    protected UserMapper userMapper;

    @Mappings({
            @Mapping(
                    target = "readBy",
                    expression = "java(new java.util.ArrayList<>(message.getReadBy()))"
            ),
            @Mapping(
                    target = "conversationId",
                    source = "conversation.id"
            ),
            @Mapping(
                    target = "sender",
                    expression = "java(userMapper.toUserSummary(message.getSender()))"
            ),
            @Mapping(
                    target = "receiver",
                    expression = "java(userMapper.toUserSummary(message.getReceiver()))"
            ),
            @Mapping(
                    target = "content",
                    expression = "java(message.getContent() == null || message.getContent().isEmpty() " +
                            "|| !(message.getType() == com.hoanghuy04.instagrambackend.enums.MessageType.IMAGE " +
                            "|| message.getType() == com.hoanghuy04.instagrambackend.enums.MessageType.VIDEO) " +
                            "? message.getContent() " +
                            ": fileService.getMediaFileResponse(message.getContent()).getUrl())"
            )


    })
    public abstract MessageResponse toMessageDTO(Message message);

    public abstract ConversationResponse toConversationDTO(Conversation conversation);

    public abstract Conversation toConversationEntity(ConversationResponse conversationResponse);

}
