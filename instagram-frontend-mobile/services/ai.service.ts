import axiosInstance from '../config/axiosInstance';
import { API_ENDPOINTS } from '../config/routes';
import { Message, Conversation } from '../types';

export const aiAPI = {
  // Send message to AI assistant, returns the AI response with conversationId
  sendMessage: async (prompt: string): Promise<Message> => {
    const response = await axiosInstance.post(API_ENDPOINTS.AI_CHAT, {
      content: prompt,
    });
    return response.data.data; // Returns MessageResponse which includes conversationId
  },

  // Send prompt to AI with optional conversationId
  sendPrompt: async (prompt: string, opts?: { conversationId?: string }): Promise<{ message: Message; conversationId: string }> => {
    const response = await axiosInstance.post(API_ENDPOINTS.AI_CHAT, {
      content: prompt,
      ...(opts?.conversationId && { conversationId: opts.conversationId }),
    });
    const message = response.data.data;
    return {
      message,
      conversationId: message.conversationId || opts?.conversationId || '',
    };
  },

  // Get or create AI conversation
  getConversation: async (): Promise<Conversation> => {
    const response = await axiosInstance.get(API_ENDPOINTS.AI_CONVERSATION);
    return response.data.data;
  },

  // Clear AI conversation history
  clearHistory: async (): Promise<void> => {
    await axiosInstance.delete(API_ENDPOINTS.AI_CLEAR_HISTORY);
  },
};

