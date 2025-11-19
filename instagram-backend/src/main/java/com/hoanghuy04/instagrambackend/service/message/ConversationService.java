package com.hoanghuy04.instagrambackend.service.message;

import com.hoanghuy04.instagrambackend.entity.Message;
import com.hoanghuy04.instagrambackend.entity.message.Conversation;
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
    Optional<Conversation> getExistingDirectConversation(String userId1, String userId2);

    /**
     * Create a new direct conversation between two users.
     *
     * @param userId1 first user ID (creator)
     * @param userId2 second user ID
     * @return newly created Conversation
     */
    @Transactional
    Conversation createDirectConversation(String userId1, String userId2);

    /**
     * Create a group conversation.
     *
     * @param creatorId the user ID who creates the group
     * @param participantIds list of participant user IDs
     * @param groupName the name of the group
     * @param avatar the avatar URL of the group
     * @return Conversation entity
     */
    @Transactional
    Conversation createGroupConversation(
            String creatorId,
            List<String> participantIds,
            String groupName,
            String avatar
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
     * @param removedBy the user ID who removes the member
     */
    @Transactional
    void removeMember(String conversationId, String userId, String removedBy);

    /**
     * Leave a group conversation.
     *
     * @param conversationId the conversation ID
     * @param userId the user ID who leaves
     */
    @Transactional
    void leaveGroup(String conversationId, String userId);

    /**
     * Update group information.
     *
     * @param conversationId the conversation ID
     * @param name the new group name
     * @param avatar the new avatar URL
     * @return updated Conversation entity
     */
    @Transactional
    Conversation updateGroupInfo(String conversationId, String name, String avatar);

    /**
     * Get all conversations for a user (excluding deleted conversations).
     *
     * @param userId the user ID
     * @return List of conversations
     */
    @Transactional(readOnly = true)
    List<Conversation> getUserConversations(String userId);

    /**
     * Update the last message in a conversation.
     *
     * @param conversationId the conversation ID
     * @param message the message to set as last message
     */
    @Transactional
    void updateLastMessage(String conversationId, Message message);

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
    Conversation getConversationById(String conversationId);
}
