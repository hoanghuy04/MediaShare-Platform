import axiosInstance from '../config/axiosInstance';
import { API_ENDPOINTS } from '../config/routes';
import {
  Message,
  InboxItem,
  PaginatedResponse,
  Conversation,
  ConversationMember,
} from '../types';

// Invite Link Types
export interface InviteLinkResponse {
  conversationId: string;
  token: string;
  url: string;
  createdAt: string;
  expiresAt: string | null;
  maxUses: number | null;
  usedCount: number;
  active: boolean;
}

// Message API
export const messageAPI = {
  getInbox: async (page = 0, limit = 20): Promise<PaginatedResponse<InboxItem>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.INBOX, {
      params: { page, size: limit }, // Backend uses 'size' not 'limit'
    });
    return response.data.data; // Backend returns ApiResponse<PageResponse<InboxItemDTO>>
  },
  resolveDirectByPeer: async (peerId: string): Promise<string | null> => {
    const res = await axiosInstance.get(`/api/conversations/direct/by-user/${peerId}`);
    return res.data?.data ?? null; // String hoặc null
  },

  getConversation: async (conversationId: string): Promise<Conversation> => {
    const response = await axiosInstance.get(API_ENDPOINTS.CONVERSATION_DETAIL(conversationId));
    return response.data.data;
  },

  getMessages: async (
    conversationId: string,
    page = 0,
    limit = 50
  ): Promise<PaginatedResponse<Message>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.CONVERSATION_MESSAGES(conversationId), {
      params: { page, limit },
    });
    return response.data.data;
  },

  sendDirectMessage: async (
    receiverId: string,
    content: string,
    type?: string
  ): Promise<Message> => {
    const response = await axiosInstance.post(
      API_ENDPOINTS.SEND_DIRECT_MESSAGE,
      { receiverId, content, type: type || 'TEXT' }
    );
    return response.data.data;
  },

  sendMessage: async (
    conversationId: string,
    content: string,
    type?: string,
    replyToMessageId?: string
  ): Promise<Message> => {
    const response = await axiosInstance.post(
      API_ENDPOINTS.SEND_MESSAGE(conversationId),
      { content, type: type || 'TEXT', replyToMessageId }
    );
    return response.data.data;
  },

  markAsRead: async (messageId: string): Promise<void> => {
    await axiosInstance.post(
      API_ENDPOINTS.MARK_MESSAGE_READ(messageId),
      null
    );
  },

  deleteMessage: async (messageId: string): Promise<void> => {
    await axiosInstance.delete(
      API_ENDPOINTS.DELETE_MESSAGE(messageId)
    );
  },

  deleteConversation: async (conversationId: string): Promise<void> => {
    await axiosInstance.delete(
      API_ENDPOINTS.DELETE_CONVERSATION(conversationId)
    );
  },

  createGroup: async (groupName: string, participantIds: string[], avatar?: string | null): Promise<Conversation> => {
    const response = await axiosInstance.post(
      API_ENDPOINTS.CREATE_GROUP,
      { groupName, participantIds, avatar: avatar ?? null }
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
  const response = await axiosInstance.put(
    API_ENDPOINTS.UPDATE_CONVERSATION(conversationId),
    data
  );
  return response.data.data;
},

  addGroupMembers: async (conversationId: string, userIds: string[]): Promise<void> => {
    await axiosInstance.post(
      API_ENDPOINTS.ADD_MEMBERS(conversationId),
      { userIds }
    );
  },

  leaveGroup: async (conversationId: string): Promise<void> => {
    await axiosInstance.post(
      API_ENDPOINTS.LEAVE_GROUP(conversationId),
      null
    );
  },

  removeGroupMember: async (conversationId: string, userId: string): Promise<void> => {
    await axiosInstance.delete(
      API_ENDPOINTS.REMOVE_MEMBER(conversationId, userId)
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

  updateNickname: async (
    conversationId: string,
    targetUserId: string,
    nickname: string | null
  ): Promise<ConversationMember> => {
    const response = await axiosInstance.patch(
      API_ENDPOINTS.CONVERSATION_NICKNAME(conversationId),
      { targetUserId, nickname }
    );
    return response.data.data;
  },

  // Invite Link APIs
  getInviteLink: async (conversationId: string): Promise<InviteLinkResponse | null> => {
    const response = await axiosInstance.get(
      API_ENDPOINTS.GET_INVITE_LINK(conversationId)
    );
    return response.data.data; // Can be null if no active link
  },

  createOrRotateInviteLink: async (
    conversationId: string,
    payload?: { maxUses?: number; expiresAt?: string }
  ): Promise<InviteLinkResponse> => {
    const response = await axiosInstance.post(
      API_ENDPOINTS.CREATE_INVITE_LINK(conversationId),
      payload || {}
    );
    return response.data.data;
  },

  revokeInviteLink: async (conversationId: string): Promise<void> => {
    await axiosInstance.delete(
      API_ENDPOINTS.REVOKE_INVITE_LINK(conversationId)
    );
  },

  updateInviteLinkActive: async (
    conversationId: string,
    active: boolean
  ): Promise<InviteLinkResponse> => {
    const response = await axiosInstance.put(
      API_ENDPOINTS.UPDATE_INVITE_LINK_ACTIVE(conversationId),
      { active }
    );
    return response.data.data;
  },

  joinByInviteToken: async (token: string): Promise<Conversation> => {
    const response = await axiosInstance.post(
      API_ENDPOINTS.JOIN_BY_INVITE_TOKEN(token),
      null
    );
    return response.data.data;
  },
};