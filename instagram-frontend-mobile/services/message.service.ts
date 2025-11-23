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
  // Get inbox items (conversations + sent message requests)
  getInbox: async (page = 0, limit = 20): Promise<PaginatedResponse<InboxItem>> => {
    // userId will be automatically added by axios interceptor
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

  // Get conversation details
  getConversation: async (conversationId: string): Promise<Conversation> => {
    const userId = axiosInstance.defaults.headers.common['X-User-ID'];
    const response = await axiosInstance.get(API_ENDPOINTS.CONVERSATION_DETAIL(conversationId), {
      params: { userId },
    });

    return response.data.data;
  },

  // Get messages in a conversation
  getMessages: async (
    conversationId: string,
    page = 0,
    limit = 50
  ): Promise<PaginatedResponse<Message>> => {
    const userId = axiosInstance.defaults.headers.common['X-User-ID'];
    const response = await axiosInstance.get(API_ENDPOINTS.CONVERSATION_MESSAGES(conversationId), {
      params: { userId, page, limit },
    });

    console.log("_______________Messages LOAD FROM API__________:", response.data.data);
    
    return response.data.data;
  },

  // Send direct message (auto-creates conversation if needed)
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

  // Send message to existing conversation
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

  // Mark message as read (marks all messages in conversation)
  markAsRead: async (messageId: string): Promise<void> => {
    const userId = axiosInstance.defaults.headers.common['X-User-ID'];
    await axiosInstance.post(
      API_ENDPOINTS.MARK_MESSAGE_READ(messageId),
      null,
      { params: { userId } }
    );
  },

  // Delete message (soft delete)
  deleteMessage: async (messageId: string): Promise<void> => {
    const userId = axiosInstance.defaults.headers.common['X-User-ID'];
    await axiosInstance.delete(
      API_ENDPOINTS.DELETE_MESSAGE(messageId),
      { params: { userId } }
    );
  },

  // Delete conversation (soft delete)
  deleteConversation: async (conversationId: string): Promise<void> => {
    const userId = axiosInstance.defaults.headers.common['X-User-ID'];
    await axiosInstance.delete(
      API_ENDPOINTS.DELETE_CONVERSATION(conversationId),
      { params: { userId } }
    );
  },

  // Create group chat
  createGroup: async (groupName: string, participantIds: string[], avatar?: string | null): Promise<Conversation> => {
    const creatorId = axiosInstance.defaults.headers.common['X-User-ID'];
    const response = await axiosInstance.post(
      API_ENDPOINTS.CREATE_GROUP,
      { groupName, participantIds, avatar: avatar ?? null },
      { params: { creatorId } }
    );
    return response.data.data;
  },

  // Update group info
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

  // Add members to group
  addGroupMembers: async (conversationId: string, addedBy: string, userIds: string[]): Promise<void> => {
    await axiosInstance.post(
      API_ENDPOINTS.ADD_MEMBERS(conversationId),
      { userIds },
      { params: { addedBy } }
    );
  },

  // Leave group
  leaveGroup: async (conversationId: string, userId?: string): Promise<void> => {
    const requesterId = userId ?? axiosInstance.defaults.headers.common['X-User-ID'];
    await axiosInstance.post(
      API_ENDPOINTS.LEAVE_GROUP(conversationId),
      null,
      { params: { userId: requesterId } }
    );
  },

  // Remove member from group
  removeGroupMember: async (conversationId: string, userId: string): Promise<void> => {
    const removedBy = axiosInstance.defaults.headers.common['X-User-ID'];
    await axiosInstance.delete(
      API_ENDPOINTS.REMOVE_MEMBER(conversationId, userId),
      { params: { removedBy } }
    );
  },

  // Promote member to admin
  promoteGroupAdmin: async (conversationId: string, userId: string): Promise<void> => {
    await axiosInstance.post(
      API_ENDPOINTS.PROMOTE_ADMIN(conversationId, userId),
      null,
    );
  },

  // Demote admin to member
  demoteGroupAdmin: async (conversationId: string, userId: string): Promise<void> => {
    await axiosInstance.post(
      API_ENDPOINTS.DEMOTE_ADMIN(conversationId, userId),
      null,
    );
  },
};