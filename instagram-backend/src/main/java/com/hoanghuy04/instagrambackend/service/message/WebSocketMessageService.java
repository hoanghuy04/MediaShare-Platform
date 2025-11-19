package com.hoanghuy04.instagrambackend.service.message;

import com.hoanghuy04.instagrambackend.entity.Message;
import org.springframework.stereotype.Service;

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
    void pushMessage(Message message);

    /**
     * Push a read receipt via WebSocket.
     *
     * @param message the Message entity
     * @param readByUserId the user ID who read the message
     */
    void pushReadReceipt(Message message, String readByUserId);

    /**
     * Push typing indicator via WebSocket.
     *
     * @param senderId the sender user ID
     * @param receiverId the receiver user ID
     * @param isTyping true if typing, false if stopped typing
     */
    void pushTypingIndicator(String senderId, String receiverId, boolean isTyping);

    /**
     * Push error message via WebSocket.
     *
     * @param userId the user ID to send error to
     * @param errorMessage the error message
     */
    void pushError(String userId, String errorMessage);
}
