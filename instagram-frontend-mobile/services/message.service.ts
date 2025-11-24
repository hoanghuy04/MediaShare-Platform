import axiosInstance from '../config/axiosInstance';
import { API_ENDPOINTS } from '../config/routes';
import {
  Message,
  InboxItem,
  PaginatedResponse,
  Conversation,
} from '../types';

// Message API
export const messageAPI = {
  getInbox: async (page = 0, limit = 20): Promise<PaginatedResponse<InboxItem>> => {
    console.log("____________________________________getInbox____________________________________");
    const response = await axiosInstance.get(API_ENDPOINTS.INBOX, {
      params: { page, size: limit }, // Backend uses 'size' not 'limit'
    });
    return response.data.data; // Backend returns ApiResponse<PageResponse<InboxItemDTO>>
  },
  resolveDirectByPeer: async (peerId: string): Promise<string | null> => {
    const userId = axiosInstance.defaults.headers.common['X-User-ID'];
    const res = await axiosInstance.get(`/api/conversations/direct/by-user/${peerId}`, { params: { userId }});
    return res.data?.data ?? null; // String hoặc null
  },

  getConversation: async (conversationId: string): Promise<Conversation> => {
    console.log("____________________________________get conversation____________________________________");
    
    const userId = axiosInstance.defaults.headers.common['X-User-ID'];
    const response = await axiosInstance.get(API_ENDPOINTS.CONVERSATION_DETAIL(conversationId), {
      params: { userId },
    });

    return response.data.data;
  },

  getMessages: async (
    conversationId: string,
    page = 0,
    limit = 50
  ): Promise<PaginatedResponse<Message>> => {
    console.log("____________________________________getMessages____________________________________");
    const userId = axiosInstance.defaults.headers.common['X-User-ID'];
    const response = await axiosInstance.get(API_ENDPOINTS.CONVERSATION_MESSAGES(conversationId), {
      params: { userId, page, limit },
    });
    
    return response.data.data;
  },

  sendDirectMessage: async (
    receiverId: string,
    content: string,
    type?: string
  ): Promise<Message> => {
    const senderId = axiosInstance.defaults.headers.common['X-User-ID'];
    const response = await axiosInstance.post(
      API_ENDPOINTS.SEND_DIRECT_MESSAGE,
      { receiverId, content, type: type || 'TEXT' },
      { params: { senderId } }
    );
    return response.data.data;
  },

  sendMessage: async (
    conversationId: string,
    content: string,
    type?: string,
    replyToMessageId?: string
  ): Promise<Message> => {
    const senderId = axiosInstance.defaults.headers.common['X-User-ID'];
    const response = await axiosInstance.post(
      API_ENDPOINTS.SEND_MESSAGE(conversationId),
      { content, type: type || 'TEXT', replyToMessageId },
      { params: { senderId } }
    );
    return response.data.data;
  },

  markAsRead: async (messageId: string): Promise<void> => {
    const userId = axiosInstance.defaults.headers.common['X-User-ID'];
    await axiosInstance.post(
      API_ENDPOINTS.MARK_MESSAGE_READ(messageId),
      null,
      { params: { userId } }
    );
  },

  deleteMessage: async (messageId: string): Promise<void> => {
    const userId = axiosInstance.defaults.headers.common['X-User-ID'];
    await axiosInstance.delete(
      API_ENDPOINTS.DELETE_MESSAGE(messageId),
      { params: { userId } }
    );
  },

  deleteConversation: async (conversationId: string): Promise<void> => {
    const userId = axiosInstance.defaults.headers.common['X-User-ID'];
    await axiosInstance.delete(
      API_ENDPOINTS.DELETE_CONVERSATION(conversationId),
      { params: { userId } }
    );
  },

  createGroup: async (groupName: string, participantIds: string[], avatar?: string | null): Promise<Conversation> => {
    const creatorId = axiosInstance.defaults.headers.common['X-User-ID'];
    const response = await axiosInstance.post(
      API_ENDPOINTS.CREATE_GROUP,
      { groupName, participantIds, avatar: avatar ?? null },
      { params: { creatorId } }
    );
    return response.data.data;
  },

  updateConversation: async (
  conversationId: string,
  data: {
    name?: string;
    avatar?: string; // fileId hoặc '__REMOVE__'
  }
): Promise<Conversation> => {
  const userId = axiosInstance.defaults.headers.common['X-User-ID'];
  const response = await axiosInstance.put(
    API_ENDPOINTS.UPDATE_CONVERSATION(conversationId),
    data,
    { params: { userId } }
  );
  return response.data.data;
},

  addGroupMembers: async (conversationId: string, addedBy: string, userIds: string[]): Promise<void> => {
    await axiosInstance.post(
      API_ENDPOINTS.ADD_MEMBERS(conversationId),
      { userIds },
      { params: { addedBy } }
    );
  },

  leaveGroup: async (conversationId: string, userId?: string): Promise<void> => {
    const requesterId = userId ?? axiosInstance.defaults.headers.common['X-User-ID'];
    await axiosInstance.post(
      API_ENDPOINTS.LEAVE_GROUP(conversationId),
      null,
      { params: { userId: requesterId } }
    );
  },

  removeGroupMember: async (conversationId: string, userId: string): Promise<void> => {
    const removedBy = axiosInstance.defaults.headers.common['X-User-ID'];
    await axiosInstance.delete(
      API_ENDPOINTS.REMOVE_MEMBER(conversationId, userId),
      { params: { removedBy } }
    );
  },

  promoteGroupAdmin: async (conversationId: string, userId: string): Promise<void> => {
    await axiosInstance.post(
      API_ENDPOINTS.PROMOTE_ADMIN(conversationId, userId),
      null,
    );
  },

  demoteGroupAdmin: async (conversationId: string, userId: string): Promise<void> => {
    await axiosInstance.post(
      API_ENDPOINTS.DEMOTE_ADMIN(conversationId, userId),
      null,
    );
  },
};