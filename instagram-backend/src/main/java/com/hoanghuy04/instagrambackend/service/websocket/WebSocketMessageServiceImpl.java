package com.hoanghuy04.instagrambackend.service.message;

import com.hoanghuy04.instagrambackend.dto.websocket.ChatMessage;
import com.hoanghuy04.instagrambackend.entity.message.Message;
import com.hoanghuy04.instagrambackend.entity.User;
import com.hoanghuy04.instagrambackend.entity.message.Conversation;
import com.hoanghuy04.instagrambackend.enums.ConversationType;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * Service for WebSocket message operations.
 * Handles pushing messages, read receipts, and typing indicators via WebSocket.
 *
 * @author Instagram Backend Team
 * @version 2.0.0
 */
@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class WebSocketMessageServiceImpl implements WebSocketMessageService {

    SimpMessagingTemplate messagingTemplate;

    @Override
    public void pushMessage(Message message) {
        try {
            User sender = message.getSender();
            if (sender == null) {
                log.warn("Cannot push message {} - sender is null", message.getId());
                return;
            }

            ChatMessage chatMessage = buildChatMessage(message, sender);

            // Check if message belongs to a conversation (new system)
            if (message.getConversation() != null) {
                pushConversationMessage(message, chatMessage, sender);
            } else {
                // Legacy: Use receiver field (backward compatibility)
                pushLegacyMessage(message, chatMessage);
            }
        } catch (Exception e) {
            log.warn("Failed to push message via WebSocket: {}", e.getMessage());
            // Don't fail the whole operation if WebSocket push fails
        }
    }

    @Override
    public void pushReadReceipt(Message message, String readByUserId) {
        try {
            User sender = message.getSender();
            if (sender == null || sender.getId().equals(readByUserId)) {
                // Don't send read receipt if sender read their own message
                return;
            }

            ChatMessage readReceipt = ChatMessage.builder()
                    .id(message.getId())
                    .type(ChatMessage.MessageType.READ)
                    .senderId(readByUserId)
                    .receiverId(sender.getId())
                    .status(ChatMessage.MessageStatus.READ)
                    .timestamp(LocalDateTime.now())
                    .build();

            // Notify sender that message was read
            messagingTemplate.convertAndSendToUser(
                    sender.getId(),
                    "/queue/read-receipts",
                    readReceipt
            );

            log.debug("Read receipt pushed via WebSocket to user: {}", sender.getId());
        } catch (Exception e) {
            log.warn("Failed to push read receipt via WebSocket: {}", e.getMessage());
        }
    }

    @Override
    public void pushTypingIndicator(String senderId, String receiverId, boolean isTyping) {
        try {
            ChatMessage typingMessage = ChatMessage.builder()
                    .senderId(senderId)
                    .receiverId(receiverId)
                    .type(isTyping ? ChatMessage.MessageType.TYPING : ChatMessage.MessageType.STOP_TYPING)
                    .timestamp(LocalDateTime.now())
                    .build();

            // Notify receiver
            messagingTemplate.convertAndSendToUser(
                    receiverId,
                    "/queue/typing",
                    typingMessage
            );

            // Also notify sender for real-time updates
            messagingTemplate.convertAndSendToUser(
                    senderId,
                    "/queue/typing",
                    typingMessage
            );

            log.debug("Typing indicator pushed via WebSocket: {} -> {}", senderId, receiverId);
        } catch (Exception e) {
            log.warn("Failed to push typing indicator via WebSocket: {}", e.getMessage());
        }
    }

    @Override
    public void pushError(String userId, String errorMessage) {
        try {
            ChatMessage error = ChatMessage.builder()
                    .type(ChatMessage.MessageType.CHAT)
                    .content("Failed to send message: " + errorMessage)
                    .timestamp(LocalDateTime.now())
                    .build();

            messagingTemplate.convertAndSendToUser(
                    userId,
                    "/queue/errors",
                    error
            );
        } catch (Exception e) {
            log.warn("Failed to push error via WebSocket: {}", e.getMessage());
        }
    }

    /**
     * Build ChatMessage DTO from Message entity.
     */
    private ChatMessage buildChatMessage(Message message, User sender) {
        return ChatMessage.builder()
                .id(message.getId())
                .type(ChatMessage.MessageType.CHAT)
                .senderId(sender.getId())
                .senderUsername(sender.getUsername())
                .senderProfileImage(sender.getProfile() != null ? sender.getProfile().getAvatar() : null)
                .content(message.getContent())
                .mediaUrl(message.getMediaUrl())
                .timestamp(message.getCreatedAt())
                .status(ChatMessage.MessageStatus.SENT)
                .build();
    }

    /**
     * Push message for conversation-based messages (direct or group).
     */
    private void pushConversationMessage(Message message, ChatMessage chatMessage, User sender) {
        Conversation conversation = message.getConversation();

        // For GROUP conversations: push to all participants
        if (conversation.getType() == ConversationType.GROUP) {
            for (String participantId : conversation.getParticipants().stream()
                    .map(p -> p.getUserId())
                    .collect(java.util.stream.Collectors.toList())) {
                chatMessage.setReceiverId(participantId);
                messagingTemplate.convertAndSendToUser(
                        participantId,
                        "/queue/messages",
                        chatMessage
                );
                log.debug("Group message pushed via WebSocket to user: {}", participantId);
            }
        } else {
            // For DIRECT conversations: push to the other participant
            String receiverId = conversation.getParticipants().stream()
                    .map(p -> p.getUserId())
                    .filter(id -> !id.equals(sender.getId()))
                    .findFirst()
                    .orElse(null);

            if (receiverId != null) {
                chatMessage.setReceiverId(receiverId);
                messagingTemplate.convertAndSendToUser(
                        receiverId,
                        "/queue/messages",
                        chatMessage
                );
                log.debug("Direct message pushed via WebSocket to user: {}", receiverId);
            }

            // Send confirmation back to sender
            chatMessage.setReceiverId(sender.getId());
            messagingTemplate.convertAndSendToUser(
                    sender.getId(),
                    "/queue/messages",
                    chatMessage
            );
        }
    }

    /**
     * Push message for legacy messages (without conversation).
     */
    private void pushLegacyMessage(Message message, ChatMessage chatMessage) {
        User receiver = message.getReceiver();
        if (receiver != null) {
            chatMessage.setReceiverId(receiver.getId());
            messagingTemplate.convertAndSendToUser(
                    receiver.getId(),
                    "/queue/messages",
                    chatMessage
            );
            log.debug("Legacy message pushed via WebSocket to user: {}", receiver.getId());
        }

        // Send confirmation back to sender
        User sender = message.getSender();
        if (sender != null) {
            chatMessage.setReceiverId(sender.getId());
            messagingTemplate.convertAndSendToUser(
                    sender.getId(),
                    "/queue/messages",
                    chatMessage
            );
        }
    }
}
