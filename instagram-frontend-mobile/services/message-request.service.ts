import axiosInstance from '../config/axiosInstance';
import { API_ENDPOINTS } from '../config/routes';
import { MessageRequest, Message, InboxItem, PaginatedResponse } from '../types';

export const messageRequestAPI = {
  getPendingRequests: async (): Promise<MessageRequest[]> => {
    const userId = axiosInstance.defaults.headers.common['X-User-ID'];
    const response = await axiosInstance.get(API_ENDPOINTS.MESSAGE_REQUESTS, {
      params: { userId },
    });
    return response.data.data;
  },

  getPendingRequestsCount: async (): Promise<number> => {
    const userId = axiosInstance.defaults.headers.common['X-User-ID'];
    const response = await axiosInstance.get(API_ENDPOINTS.MESSAGE_REQUESTS_COUNT, {
      params: { userId },
    });
    return response.data.data;
  },

  getPendingInboxItems: async (page = 0, limit = 20): Promise<PaginatedResponse<InboxItem>> => {
    const userId = axiosInstance.defaults.headers.common['X-User-ID'];
    const response = await axiosInstance.get(API_ENDPOINTS.MESSAGE_REQUESTS_INBOX, {
      params: { userId, page, size: limit }, // Backend uses 'size' not 'limit'
    });
    return response.data.data;
  },

  getPendingMessages: async (senderId: string, receiverId: string): Promise<Message[]> => {
    const response = await axiosInstance.get(API_ENDPOINTS.MESSAGE_REQUESTS_PENDING_MESSAGES, {
      params: { senderId, receiverId },
    });
    return response.data.data;
  },

  getPendingMessagesByRequestId: async (requestId: string): Promise<Message[]> => {
    const userId = axiosInstance.defaults.headers.common['X-User-ID'];
    const response = await axiosInstance.get(
      API_ENDPOINTS.MESSAGE_REQUESTS_PENDING_MESSAGES_BY_ID(requestId),
      {
        params: { userId },
      }
    );
    return response.data.data;
  },
};

