package com.hoanghuy04.instagrambackend.service.ai;

import com.hoanghuy04.instagrambackend.dto.response.ConversationResponse;
import com.hoanghuy04.instagrambackend.dto.response.MessageResponse;
import com.hoanghuy04.instagrambackend.entity.Message;
import org.springframework.stereotype.Service;

/**
 * Service interface for AI chat operations.
 * Handles AI conversation management and message processing.
 *
 * @author Instagram Backend Team
 * @version 1.0.0
 */
@Service
public interface AiChatService {

    /**
     * Send a prompt to AI and get response.
     * Automatically creates or finds direct conversation with AI.
     *
     * @param userId the user ID sending the prompt
     * @param prompt the prompt text
     * @return AI response message
     */
    Message sendPrompt(String userId, String prompt, String conversationId);

    /**
     * Send a prompt to AI and get response as DTO.
     *
     * @param userId the user ID sending the prompt
     * @param prompt the prompt text
     * @return AI response as MessageResponse DTO
     */
    MessageResponse sendPromptAndGetResponse(String userId, String prompt, String conversationId);

    /**
     * Get or create AI conversation for a user.
     *
     * @param userId the user ID
     * @return Conversation details
     */
    ConversationResponse getAiConversation(String userId);

    /**
     * Clear AI conversation history.
     *
     * @param userId the user ID
     */
    void clearConversationHistory(String userId);
}
