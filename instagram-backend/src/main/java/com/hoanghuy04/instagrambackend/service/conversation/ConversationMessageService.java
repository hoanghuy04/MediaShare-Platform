package com.hoanghuy04.instagrambackend.service.conversation;

import com.hoanghuy04.instagrambackend.dto.response.ConversationResponse;
import com.hoanghuy04.instagrambackend.dto.response.InboxItemResponse;
import com.hoanghuy04.instagrambackend.dto.response.MessageResponse;
import com.hoanghuy04.instagrambackend.dto.response.PageResponse;
import com.hoanghuy04.instagrambackend.entity.Message;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service interface for conversation-based message operations.
 * Handles sending, reading, and managing messages within conversations.
 * 
 * @author Instagram Backend Team
 * @version 2.0.0
 */
@Service
public interface ConversationMessageService {
    
    /**
     * Send a message to a conversation.
     * Also checks for message requests if users are not connected.
     *
     * @param conversationId the conversation ID
     * @param senderId the sender user ID
     * @param type the message type (TEXT, IMAGE, VIDEO, AUDIO, POST_SHARE)
     * @param content the message content (meaning depends on type)
     * @return Message entity
     */
    @Transactional
    MessageResponse sendMessageToConversation(String conversationId, String senderId, com.hoanghuy04.instagrambackend.enums.MessageType type, String content);

    /**
     * Send a message to a user (backward compatibility).
     * Checks for connection and creates message request if needed.
     *
     * @param senderId the sender ID
     * @param receiverId the receiver ID
     * @param type the message type (TEXT, IMAGE, VIDEO, AUDIO, POST_SHARE)
     * @param content the message content (meaning depends on type)
     * @return Message entity
     */
    @Transactional
    MessageResponse sendMessage(String senderId, String receiverId, com.hoanghuy04.instagrambackend.enums.MessageType type, String content);

    /**
     * Get messages in a conversation as DTOs (excluding deleted by user).
     *
     * @param conversationId the conversation ID
     * @param userId the user ID
     * @param pageable pagination information
     * @return PageResponse of MessageDTO
     */
    @Transactional(readOnly = true)
    PageResponse<MessageResponse> getConversationMessagesAsDTO(String conversationId, String userId, Pageable pageable);

    /**
     * Mark a message as read (unified intelligent method).
     * - Adds userId to readBy list
     * - Marks all messages in conversation as read (Instagram-style)
     * - Pushes WebSocket read receipt
     * 
     * Behavior:
     * - For conversation messages: marks all unread messages in the conversation as read
     * - For legacy messages: marks all messages between sender and receiver as read
     *
     * @param messageId the message ID
     */
    @Transactional
    void markAsRead(String messageId);

    /**
     * Delete a message for a user (soft delete).
     *
     * @param messageId the message ID
     * @param userId the user ID
     */
    @Transactional
    void deleteMessageForUser(String messageId, String userId);

    /**
     * Delete a conversation for a user (soft delete).
     * Hides the conversation from user's list but keeps it visible to others.
     *
     * @param conversationId the conversation ID
     * @param userId the user ID
     */
    @Transactional
    void deleteConversationForUser(String conversationId, String userId);

    /**
     * Reply to a message (threading support).
     *
     * @param conversationId the conversation ID
     * @param senderId the sender ID
     * @param replyToMessageId the message ID to reply to
     * @param content the reply content
     * @return Message entity
     */
    @Transactional
    MessageResponse replyToMessage(String conversationId, String senderId, String replyToMessageId, String content);

    /**
     * Check if two users are connected.
     * Users are considered connected if:
     * 1. They follow each other, OR
     * 2. They have an existing conversation (already chatting before)
     *
     * @param userId1 first user ID
     * @param userId2 second user ID
     * @return true if users are connected
     */
    @Transactional(readOnly = true)
    boolean areUsersConnected(String userId1, String userId2);

    /**
     * Get inbox items for a user (conversations + sent message requests).
     * Inbox includes:
     * - All conversations the user participates in
     * - Message requests sent by the user (status=PENDING)
     *
     * @param userId the user ID
     * @param pageable pagination information
     * @return PageResponse of InboxItemDTO sorted by timestamp
     */
    @Transactional(readOnly = true)
    PageResponse<InboxItemResponse> getInboxItems(String userId, Pageable pageable);

    /**
     * Get conversation details as DTO.
     *
     * @param conversationId the conversation ID
     * @param userId the user ID (to verify access and calculate unread count)
     * @return ConversationDTO
     */
    @Transactional(readOnly = true)
    ConversationResponse getConversationAsDTO(String conversationId, String userId);

    /**
     * Create a group conversation and return as DTO.
     *
     * @param creatorId the creator user ID
     * @param participantIds list of participant IDs
     * @param groupName the group name
     * @return ConversationDTO
     */
    @Transactional
    ConversationResponse createGroupAndConvertToDTO(
            String creatorId,
            List<String> participantIds,
            String groupName);

    /**
     * Update group info and return as DTO.
     *
     * @param conversationId the conversation ID
     * @param name the new group name
     * @param avatar the new avatar URL
     * @param userId the user ID (must be admin)
     * @return ConversationDTO
     */
    @Transactional
    ConversationResponse updateGroupAndConvertToDTO(
            String conversationId,
            String name,
            String avatar,
            String userId
    );

}
