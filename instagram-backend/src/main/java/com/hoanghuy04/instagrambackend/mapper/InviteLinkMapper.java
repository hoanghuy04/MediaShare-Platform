package com.hoanghuy04.instagrambackend.mapper;

import com.hoanghuy04.instagrambackend.dto.response.InviteLinkResponse;
import com.hoanghuy04.instagrambackend.entity.ConversationInviteLink;
import lombok.extern.slf4j.Slf4j;
import org.mapstruct.*;
import org.springframework.beans.factory.annotation.Value;

/**
 * Mapper for ConversationInviteLink entities and DTOs.
 * Handles conversion between ConversationInviteLink entity and InviteLinkResponse DTO.
 *
 * @author Instagram Backend Team
 * @version 2.0.0
 */
@Mapper(
        componentModel = "spring",
        unmappedTargetPolicy = ReportingPolicy.IGNORE,
        injectionStrategy = InjectionStrategy.FIELD
)
@Slf4j
public abstract class InviteLinkMapper {

    @Value("${app.base-url:http://localhost:8080}")
    protected String baseUrl;

    /**
     * Convert ConversationInviteLink entity to InviteLinkResponse DTO.
     * Automatically builds the URL from the token.
     *
     * @param inviteLink the entity to convert
     * @return InviteLinkResponse DTO
     */
    @Mappings({
            @Mapping(
                    target = "url",
                    expression = "java(buildInviteUrl(inviteLink.getToken()))"
            )
    })
    public abstract InviteLinkResponse toInviteLinkResponse(ConversationInviteLink inviteLink);

    /**
     * Build the full invite URL from token.
     *
     * @param token the invite token
     * @return the full URL
     */
    protected String buildInviteUrl(String token) {
        if (token == null || token.isBlank()) {
            return null;
        }
        return baseUrl + "/join/" + token;
    }

    /**
     * Convert InviteLinkResponse DTO to ConversationInviteLink entity.
     * Note: This is a one-way conversion, URL is not stored in entity.
     *
     * @param response the DTO to convert
     * @return ConversationInviteLink entity
     */
    public abstract ConversationInviteLink toInviteLinkEntity(InviteLinkResponse response);
}

