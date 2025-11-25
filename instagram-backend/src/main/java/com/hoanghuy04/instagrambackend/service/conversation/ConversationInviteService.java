package com.hoanghuy04.instagrambackend.service.conversation;

import com.hoanghuy04.instagrambackend.dto.request.CreateInviteLinkRequest;
import com.hoanghuy04.instagrambackend.dto.response.ConversationResponse;
import com.hoanghuy04.instagrambackend.dto.response.InviteLinkResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public interface ConversationInviteService {
    
    /**
     * Create or rotate invite link for a group conversation.
     * If an active link exists, it will be revoked and a new one created.
     *
     * @param conversationId the conversation ID
     * @param requesterId the user ID requesting the link
     * @param request the request containing optional maxUses and expiresAt
     * @return InviteLinkResponse with the new link
     */
    @Transactional
    InviteLinkResponse createOrRotateInviteLink(String conversationId, String requesterId, CreateInviteLinkRequest request);

    /**
     * Get the active invite link for a conversation.
     *
     * @param conversationId the conversation ID
     * @param requesterId the user ID requesting the link
     * @return InviteLinkResponse or null if no active link exists
     */
    @Transactional(readOnly = true)
    InviteLinkResponse getActiveInviteLink(String conversationId, String requesterId);

    /**
     * Revoke the active invite link for a conversation.
     *
     * @param conversationId the conversation ID
     * @param requesterId the user ID revoking the link
     */
    @Transactional
    void revokeInviteLink(String conversationId, String requesterId);

    /**
     * Update the active status of the invite link.
     *
     * @param conversationId the conversation ID
     * @param requesterId the user ID updating the link
     * @param active true to enable, false to disable
     * @return InviteLinkResponse with updated status
     */
    @Transactional
    InviteLinkResponse updateInviteLinkActive(String conversationId, String requesterId, Boolean active);

    /**
     * Join a conversation using an invite token.
     *
     * @param token the invite token
     * @param userId the user ID joining the conversation
     * @return ConversationResponse for the joined conversation
     */
    @Transactional
    ConversationResponse joinByInviteToken(String token, String userId);
}

