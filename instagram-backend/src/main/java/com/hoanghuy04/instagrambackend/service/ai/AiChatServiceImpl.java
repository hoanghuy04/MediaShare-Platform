package com.hoanghuy04.instagrambackend.service.ai;

import com.hoanghuy04.instagrambackend.dto.response.ConversationResponse;
import com.hoanghuy04.instagrambackend.dto.response.MessageResponse;
import com.hoanghuy04.instagrambackend.entity.Conversation;
import com.hoanghuy04.instagrambackend.entity.Message;
import com.hoanghuy04.instagrambackend.entity.User;
import com.hoanghuy04.instagrambackend.exception.ResourceNotFoundException;
import com.hoanghuy04.instagrambackend.mapper.MessageMapper;
import com.hoanghuy04.instagrambackend.repository.ConversationRepository;
import com.hoanghuy04.instagrambackend.repository.MessageRepository;
import com.hoanghuy04.instagrambackend.service.conversation.ConversationMessageService;
import com.hoanghuy04.instagrambackend.service.conversation.ConversationService;
import com.hoanghuy04.instagrambackend.service.user.UserService;
import com.hoanghuy04.instagrambackend.service.websocket.WebSocketMessageService;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Implementation of AI chat service.
 * Integrates Spring AI ChatClient with MongoDB memory storage.
 *
 * @author Instagram Backend Team
 * @version 1.0.0
 */
@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = lombok.AccessLevel.PRIVATE)
public class AiChatServiceImpl implements AiChatService {

    ChatClient chatClient;
    MongoChatMemory mongoChatMemory;
    ConversationService conversationService;
    UserService userService;
    MessageMapper messageMapper;
    MessageRepository messageRepository;
    ConversationRepository conversationRepository;

    @Override
    @Transactional
    public Message sendPrompt(String userId, String prompt, String conversationId) {
        log.info("User {} sending prompt to AI: {}", userId, prompt);

        User aiUser = userService.ensureAiUser();

        if(conversationId==null){
            conversationId = conversationService.findOrCreateDirect(userId, aiUser.getId());
        }

        MessageChatMemoryAdvisor chatMemoryAdvisor = MessageChatMemoryAdvisor
                .builder(mongoChatMemory)
                .conversationId(conversationId)
                .build();

        String aiResponseText;
        try {
            aiResponseText = chatClient
                    .prompt()
                    .user(prompt)
                    .advisors(List.of(chatMemoryAdvisor))
                    .call()
                    .content();

            log.info("AI response received: {}", aiResponseText);
        } catch (Exception e) {
            log.error("Error calling AI service", e);
        }
        return messageRepository
                .findByConversation_IdOrderByCreatedAtDesc(conversationId)
                .stream().findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));
    }

    @Override
    @Transactional
    public MessageResponse sendPromptAndGetResponse(String userId, String prompt, String conversationId) {
        Message aiMessage = sendPrompt(userId, prompt, conversationId);
        return messageMapper.toMessageDTO(aiMessage);
    }

    @Override
    @Transactional(readOnly = true)
    public ConversationResponse getAiConversation(String userId) {
        log.info("Getting AI conversation for user {}", userId);

        // Get or create AI user
        User aiUser = userService.ensureAiUser();

        // Find or create conversation
        String conversationId = conversationService.findOrCreateDirect(userId, aiUser.getId());

        // Get conversation details
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found with id: " + conversationId));

        // Map to response using MessageMapper (which has ConversationDTO mapping)
        return messageMapper.toConversationDTO(conversation);
    }

    @Override
    @Transactional
    public void clearConversationHistory(String userId) {
        log.info("Clearing AI conversation history for user {}", userId);

        // Get AI user
        User aiUser = userService.ensureAiUser();

        // Find conversation
        String conversationId = conversationService.findOrCreateDirect(userId, aiUser.getId());

        // Clear conversation memory
        mongoChatMemory.clear(conversationId);

        log.info("AI conversation history cleared for user {}", userId);
    }
}
