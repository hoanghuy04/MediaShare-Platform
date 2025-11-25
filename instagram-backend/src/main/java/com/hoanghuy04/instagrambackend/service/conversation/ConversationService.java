package com.hoanghuy04.instagrambackend.service.conversation;

import com.hoanghuy04.instagrambackend.dto.response.ConversationResponse;
import com.hoanghuy04.instagrambackend.dto.response.MessageResponse;
import com.hoanghuy04.instagrambackend.entity.Message;
import com.hoanghuy04.instagrambackend.entity.Conversation;
import com.hoanghuy04.instagrambackend.entity.conversation.ConversationMember;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Service interface for conversation operations.
 * Handles conversation management, member management, and group operations.
 * 
 * @author Instagram Backend Team
 * @version 2.0.0
 */
@Service
public interface ConversationService {
    
    /**
     * Get existing direct conversation (if any) between two users.
     *
     * @param userId1 first user ID
     * @param userId2 second user ID
     * @return Optional conversation
     */
    @Transactional(readOnly = true)
    ConversationResponse getExistingDirectConversation(String userId1, String userId2);

    /**
     * Create a new direct conversation between two users.
     *
     * @param userId1 first user ID (creator)
     * @param userId2 second user ID
     * @return newly created Conversation
     */
    @Transactional
    ConversationResponse createDirectConversation(String userId1, String userId2);

    @Transactional
    String findOrCreateDirect(String userId, String peerId);
    /**
     * Create a group conversation.
     *
     * @param creatorId the user ID who creates the group
     * @param participantIds list of participant user IDs
     * @param groupName the name of the group
     * @return Conversation entity
     */
    @Transactional
    ConversationResponse createGroupConversation(
            String creatorId,
            List<String> participantIds,
            String groupName
    );

    /**
     * Add member to a group conversation.
     *
     * @param conversationId the conversation ID
     * @param userId the user ID to add
     * @param addedBy the user ID who adds the member
     */
    @Transactional
    void addMember(String conversationId, String userId, String addedBy);

    /**
     * Remove member from a group conversation.
     *
     * @param conversationId the conversation ID
     * @param userId the user ID to remove
     */
    @Transactional
    void removeMember(String conversationId, String userId);

    /**
     * Leave a group conversation.
     *
     * @param conversationId the conversation ID
     * @param userId the user ID who leaves
     */
    @Transactional
    void leaveGroup(String conversationId, String userId);

    /**
     * Get all conversations for a user (excluding deleted conversations).
     *
     * @param userId the user ID
     * @return List of conversations
     */
    @Transactional(readOnly = true)
    List<ConversationResponse> getUserConversations(String userId);

    /**
     * Update the last message in a conversation.
     *
     * @param conversationId the conversation ID
     * @param message the message to set as last message
     */
    @Transactional
    void updateLastMessage(String conversationId, MessageResponse message);

    /**
     * Check if a user is a participant in a conversation.
     *
     * @param conversationId the conversation ID
     * @param userId the user ID
     * @return true if user is participant, false otherwise
     */
    @Transactional(readOnly = true)
    boolean isParticipant(String conversationId, String userId);

    /**
     * Get conversation by ID.
     *
     * @param conversationId the conversation ID
     * @return Conversation entity
     */
    @Transactional(readOnly = true)
    ConversationResponse getConversationById(String conversationId);

    ConversationResponse updateGroupInfo(
            String conversationId,
            String name,
            String avatarFileId,
            String updatedByUserId
    );

    /**
     * Update a member's nickname in a conversation.
     *
     * @param conversationId the conversation ID
     * @param requesterId the user ID requesting the update
     * @param request the update request containing targetUserId and nickname
     * @return the updated ConversationMember
     */
    @Transactional
    ConversationMember updateNickname(String conversationId, String requesterId, com.hoanghuy04.instagrambackend.dto.request.conversation.UpdateNicknameRequest request);

    /**
     * Promote a member to admin role.
     *
     * @param conversationId the conversation ID
     * @param userId the user ID to promote
     */
    @Transactional
    void promoteMemberToAdmin(String conversationId, String userId);

    /**
     * Demote an admin to member role.
     *
     * @param conversationId the conversation ID
     * @param userId the user ID to demote
     */
    @Transactional
    void demoteAdminToMember(String conversationId, String userId);

    String directKeyOf(String u1, String u2);
}
