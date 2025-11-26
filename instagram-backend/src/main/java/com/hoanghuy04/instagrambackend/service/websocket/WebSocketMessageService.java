package com.hoanghuy04.instagrambackend.service.websocket;

import com.hoanghuy04.instagrambackend.dto.response.MessageResponse;
import com.hoanghuy04.instagrambackend.entity.Message;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Service interface for WebSocket message operations.
 * Handles pushing messages, read receipts, and typing indicators via WebSocket.
 *
 * @author Instagram Backend Team
 * @version 2.0.0
 */
@Service
public interface WebSocketMessageService {
    
    /**
     * Push a message via WebSocket to all recipients.
     * For direct messages: push to receiver.
     * For group messages: push to all participants except sender.
     *
     * @param message the Message entity
     */
    void pushMessage(MessageResponse message);

    /**
     * Push a read receipt via WebSocket.
     *
     * @param message the Message entity
     * @param readByUserId the user ID who read the message
     */
    void pushReadReceipt(MessageResponse message, String readByUserId);

    /**
     * Push typing indicator via WebSocket (for direct messages).
     *
     * @param senderId the sender user ID
     * @param receiverId the receiver user ID
     * @param isTyping true if typing, false if stopped typing
     */
    void pushTypingIndicator(String senderId, String receiverId, boolean isTyping);

    /**
     * Push typing indicator for conversation via WebSocket (supports group chat).
     *
     * @param senderId the sender user ID
     * @param conversationId the conversation ID
     * @param isTyping true if typing, false if stopped typing
     */
    void pushTypingIndicatorForConversation(String senderId, String conversationId, boolean isTyping);

    /**
     * Push error message via WebSocket.
     *
     * @param userId the user ID to send error to
     * @param errorMessage the error message
     */
    void pushError(String userId, String errorMessage);

    /**
     * Push conversation update to all participants.
     * Used for: rename, avatar change, member add/remove, role changes.
     *
     * @param conversationId the conversation ID
     * @param participantIds list of participant user IDs to notify
     * @param updateType type of update (MEMBER_ADDED, MEMBER_REMOVED, etc.)
     * @param data additional data for the update
     */
    void pushConversationUpdate(String conversationId, List<String> participantIds, String updateType, Object data);


}
