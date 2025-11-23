package com.hoanghuy04.instagrambackend.service.ai;

import com.hoanghuy04.instagrambackend.dto.response.MessageResponse;
import com.hoanghuy04.instagrambackend.entity.Conversation;
import com.hoanghuy04.instagrambackend.entity.Message;
import com.hoanghuy04.instagrambackend.entity.User;
import com.hoanghuy04.instagrambackend.exception.ResourceNotFoundException;
import com.hoanghuy04.instagrambackend.exception.UnauthorizedException;
import com.hoanghuy04.instagrambackend.mapper.MessageMapper;
import com.hoanghuy04.instagrambackend.repository.ConversationRepository;
import com.hoanghuy04.instagrambackend.repository.MessageRepository;
import com.hoanghuy04.instagrambackend.repository.UserRepository;
import com.hoanghuy04.instagrambackend.service.conversation.ConversationService;
import com.hoanghuy04.instagrambackend.service.websocket.WebSocketMessageService;
import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * MongoDB-based implementation of Spring AI ChatMemory interface.
 * Stores chat messages in MongoDB and integrates with WebSocket for real-time delivery.
 *
 * @author Instagram Backend Team
 * @version 1.0.0
 */
@Component
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class MongoChatMemoryImpl implements MongoChatMemory {

    MessageRepository messageRepository;
    ConversationRepository conversationRepository;
    UserRepository userRepository;
    WebSocketMessageService webSocketMessageService;
    int maxMessages;
    ConversationService conversationService;
    MessageMapper messageMapper;

    public MongoChatMemoryImpl(
            MessageRepository messageRepository,
            ConversationRepository conversationRepository,
            UserRepository userRepository,
            WebSocketMessageService webSocketMessageService,
            ConversationService conversationService, MessageMapper messageMapper) {
        this.messageRepository = messageRepository;
        this.conversationRepository = conversationRepository;
        this.userRepository = userRepository;
        this.webSocketMessageService = webSocketMessageService;
        this.maxMessages = 10; // Default max messages for AI context
        this.conversationService = conversationService;
        this.messageMapper = messageMapper;
    }

    @Override
    public void add(String conversationId, List<org.springframework.ai.chat.messages.Message> messages) {
        // Validate conversation exists
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found with id: " + conversationId));

        User aiUser = getOrCreateAiUser();
        User currentUser = getCurrentUser();

        // Save each message to the database and broadcast
        for (org.springframework.ai.chat.messages.Message message : messages) {
            Message chatMessage = Message.builder()
                    .conversation(conversation)
                    .content(message.getText())
                    .build();

            // Determine sender based on message type
            if (message instanceof AssistantMessage) {
                chatMessage.setSender(aiUser);
            } else if (message instanceof UserMessage) {
                chatMessage.setSender(currentUser);
            }

            // Save message to database
            Message savedMessage = messageRepository.save(chatMessage);
            MessageResponse messageResponse = messageMapper.toMessageDTO(savedMessage);
            conversationService.updateLastMessage(conversationId, messageResponse);

            // Push message via WebSocket to all participants
            webSocketMessageService.pushMessage(messageResponse);
        }
    }

    @Override
    public List<org.springframework.ai.chat.messages.Message> get(String conversationId) {
        // Validate conversation exists
        conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found with id: " + conversationId));

        // Retrieve recent messages from the conversation (limited by maxMessages)
        List<Message> chatMessages = messageRepository
                .findByConversation_IdOrderByCreatedAtDesc(conversationId)
                .stream()
                .limit(maxMessages)
                .toList();

        // Convert to Spring AI Message format (reverse to maintain chronological order)
        List<org.springframework.ai.chat.messages.Message> messages = new ArrayList<>();
        for (int i = chatMessages.size() - 1; i >= 0; i--) {
            Message chatMessage = chatMessages.get(i);
            messages.add(toSpringAiMessage(chatMessage));
        }

        return messages;
    }

    @Override
    public void clear(String conversationId) {
        // Validate conversation exists
        conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found with id: " + conversationId));

        // Delete all messages in the conversation
        messageRepository.deleteByConversation_Id(conversationId);
    }

    /**
     * Convert Message entity to Spring AI Message
     */
    private org.springframework.ai.chat.messages.Message toSpringAiMessage(Message message) {
        User aiUser = getOrCreateAiUser();

        // Determine if message is from AI or user
        boolean isFromAi = message.getSender() != null &&
                          message.getSender().getId().equals(aiUser.getId());

        if (isFromAi) {
            return new AssistantMessage(message.getContent());
        } else {
            return new UserMessage(message.getContent());
        }
    }

    /**
     * Get or create the AI system user
     */
    private User getOrCreateAiUser() {
        // Try to find by username first
        return userRepository.findByUsername("ai-assistant")
                .or(() -> userRepository.findByEmail("ai@system.local")) // Try by email if username fails
                .orElseGet(() -> {
                    try {
                        User aiUser = User.builder()
                                .username("ai-assistant")
                                .email("ai@system.local")
                                .isActive(true)
                                .isVerified(true)
                                .build();
                        return userRepository.save(aiUser);
                    } catch (org.springframework.dao.DuplicateKeyException e) {
                        // If duplicate key error, try to find again (race condition)
                        return userRepository.findByUsername("ai-assistant")
                                .or(() -> userRepository.findByEmail("ai@system.local"))
                                .orElseThrow(() -> new RuntimeException("Failed to create or find AI user"));
                    }
                });
    }

    /**
     * Get the current authenticated user
     */
    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new UnauthorizedException("User is not authenticated");
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof UserDetails userDetails) {
            String username = userDetails.getUsername();
            return userRepository.findByUsername(username)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with username: " + username));
        }

        throw new UnauthorizedException("User is not authenticated");
    }
}
