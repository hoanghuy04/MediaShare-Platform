import axiosInstance from '../config/axiosInstance';
import { API_ENDPOINTS } from '../config/routes';
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  UserProfile,
  UpdateProfileRequest,
  Post,
  Comment,
  CreateCommentRequest,
  Conversation,
  Message,
  MessageRequest,
  InboxItem,
  Notification,
  PaginatedResponse,
} from '../types';
import apiConfig from '../config/apiConfig';
import { CreatePostRequest } from '../types/post.type';

// Auth API
export const authAPI = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await axiosInstance.post(API_ENDPOINTS.LOGIN, data);
    return response.data.data;
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await axiosInstance.post(API_ENDPOINTS.REGISTER, data);
    return response.data.data;
  },

  logout: async (): Promise<void> => {
    await axiosInstance.post(API_ENDPOINTS.LOGOUT);
  },

  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    const response = await axiosInstance.post(API_ENDPOINTS.REFRESH_TOKEN, null, {
      params: { refreshToken },
    });
    return response.data.data;
  },

  verifyToken: async (token: string): Promise<boolean> => {
    const response = await axiosInstance.get(API_ENDPOINTS.VERIFY_TOKEN, {
      params: { token },
    });
    return response.data.data;
  },

  forgotPassword: async (email: string): Promise<void> => {
    await axiosInstance.post(API_ENDPOINTS.FORGOT_PASSWORD, { email });
  },

  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    await axiosInstance.post(API_ENDPOINTS.RESET_PASSWORD, { token, newPassword });
  },
};

// User API
export const userAPI = {
  getUserProfile: async (userId: string): Promise<UserProfile> => {
    const response = await axiosInstance.get(API_ENDPOINTS.USER_PROFILE(userId));
    return response.data.data;
  },

  updateProfile: async (userId: string, data: UpdateProfileRequest): Promise<UserProfile> => {
    const response = await axiosInstance.put(API_ENDPOINTS.UPDATE_PROFILE(userId), data);
    return response.data.data;
  },

  deleteUser: async (userId: string): Promise<void> => {
    await axiosInstance.delete(API_ENDPOINTS.DELETE_USER(userId));
  },

  searchUsers: async (
    query: string,
    page = 0,
    limit = 20
  ): Promise<PaginatedResponse<UserProfile>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.USERS + '/search', {
      params: { query, page, limit },
    });

    return response.data.data;
  },

  followUser: async (userId: string): Promise<void> => {
    await axiosInstance.post(API_ENDPOINTS.FOLLOW(userId));
  },

  unfollowUser: async (userId: string): Promise<void> => {
    await axiosInstance.delete(API_ENDPOINTS.UNFOLLOW(userId));
  },

  isFollowing: async (userId: string): Promise<boolean> => {
    const response = await axiosInstance.get(API_ENDPOINTS.IS_FOLLOWING(userId));
    return response.data.data;
  },

  getFollowers: async (userId: string, page = 0, limit = 20): Promise<UserProfile[]> => {
    // Backend trả List không phải Page
    const response = await axiosInstance.get(API_ENDPOINTS.FOLLOWERS(userId), {
      params: { page, limit },
    });
    return response.data.data;
  },

  getFollowing: async (userId: string, page = 0, limit = 20): Promise<UserProfile[]> => {
    // Backend trả List không phải Page
    const response = await axiosInstance.get(API_ENDPOINTS.FOLLOWING(userId), {
      params: { page, limit },
    });
    return response.data.data;
  },

  getUserStats: async (userId: string): Promise<any> => {
    const response = await axiosInstance.get(API_ENDPOINTS.USER_STATS(userId));
    return response.data.data;
  },
};

// Comment API
export const commentAPI = {
  getComments: async (
    postId: string,
    page = 0,
    limit = 20
  ): Promise<PaginatedResponse<Comment>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.COMMENTS(postId), {
      params: { page, limit },
    });
    
    const mappedContent = response.data.data.content.map((comment: any) => ({
      ...comment,
      isLiked: comment.likedByCurrentUser || false,
    }));
    
    return {
      ...response.data.data,
      content: mappedContent,
    };
  },

  createComment: async (data: CreateCommentRequest): Promise<Comment> => {
    const response = await axiosInstance.post(API_ENDPOINTS.CREATE_COMMENT, {
      postId: data.postId,
      text: data.text,
    });
    const comment = response.data.data;
    return {
      ...comment,
      isLiked: comment.likedByCurrentUser || false,
    };
  },

  updateComment: async (commentId: string, text: string): Promise<Comment> => {
    const response = await axiosInstance.put(API_ENDPOINTS.UPDATE_COMMENT(commentId), null, {
      params: { text },
    });
    const comment = response.data.data;
    return {
      ...comment,
      isLiked: comment.likedByCurrentUser || false,
    };
  },

  deleteComment: async (commentId: string): Promise<void> => {
    await axiosInstance.delete(API_ENDPOINTS.DELETE_COMMENT(commentId));
  },

  toggleLikeComment: async (commentId: string): Promise<boolean> => {
    const response = await axiosInstance.post(API_ENDPOINTS.TOGGLE_LIKE_COMMENT(commentId));
    return response.data.data; // Backend returns boolean: true = liked, false = unliked
  },

  replyToComment: async (commentId: string, data: CreateCommentRequest): Promise<Comment> => {
    const response = await axiosInstance.post(API_ENDPOINTS.REPLY_TO_COMMENT(commentId), data);
    const comment = response.data.data;
    return {
      ...comment,
      isLiked: comment.likedByCurrentUser || false,
    };
  },

  getReplies: async (commentId: string): Promise<Comment[]> => {
    const response = await axiosInstance.get(API_ENDPOINTS.COMMENT_REPLIES(commentId));
    const replies = response.data.data || [];
    return replies.map((comment: any) => ({
      ...comment,
      isLiked: comment.likedByCurrentUser || false,
    }));
  },
};

// Message API
export const messageAPI = {
  // Get inbox items (conversations + sent message requests)
  getInbox: async (page = 0, limit = 20): Promise<PaginatedResponse<InboxItem>> => {
    // userId will be automatically added by axios interceptor
    const response = await axiosInstance.get(API_ENDPOINTS.INBOX, {
      params: { page, limit },
    });
    return response.data.data; // Backend returns ApiResponse<PageResponse<InboxItemDTO>>
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
    return response.data.data;
  },

  // Send direct message (auto-creates conversation if needed)
  sendDirectMessage: async (
    receiverId: string,
    content: string,
    mediaUrl?: string
  ): Promise<Message> => {
    const senderId = axiosInstance.defaults.headers.common['X-User-ID'];
    const response = await axiosInstance.post(
      API_ENDPOINTS.SEND_DIRECT_MESSAGE,
      { receiverId, content, mediaUrl },
      { params: { senderId } }
    );
    return response.data.data;
  },

  // Send message to existing conversation
  sendMessage: async (
    conversationId: string,
    content: string,
    mediaUrl?: string,
    replyToMessageId?: string
  ): Promise<Message> => {
    const senderId = axiosInstance.defaults.headers.common['X-User-ID'];
    const response = await axiosInstance.post(
      API_ENDPOINTS.SEND_MESSAGE(conversationId),
      { content, mediaUrl, replyToMessageId },
      { params: { senderId } }
    );
    return response.data.data;
  },

  // Mark message as read (marks all messages in conversation)
  markAsRead: async (messageId: string): Promise<void> => {
    const userId = axiosInstance.defaults.headers.common['X-User-ID'];
    await axiosInstance.post(API_ENDPOINTS.MARK_MESSAGE_READ(messageId), null, {
      params: { userId },
    });
  },

  // Delete message (soft delete)
  deleteMessage: async (messageId: string): Promise<void> => {
    const userId = axiosInstance.defaults.headers.common['X-User-ID'];
    await axiosInstance.delete(API_ENDPOINTS.DELETE_MESSAGE(messageId), { params: { userId } });
  },

  // Delete conversation (soft delete)
  deleteConversation: async (conversationId: string): Promise<void> => {
    const userId = axiosInstance.defaults.headers.common['X-User-ID'];
    await axiosInstance.delete(API_ENDPOINTS.DELETE_CONVERSATION(conversationId), {
      params: { userId },
    });
  },

  // Create group chat
  createGroup: async (
    groupName: string,
    participantIds: string[],
    avatar?: string
  ): Promise<Conversation> => {
    const creatorId = axiosInstance.defaults.headers.common['X-User-ID'];
    const response = await axiosInstance.post(
      API_ENDPOINTS.CREATE_GROUP,
      { groupName, participantIds, avatar },
      { params: { creatorId } }
    );
    return response.data.data;
  },

  // Update group info
  updateGroup: async (
    conversationId: string,
    name: string,
    avatar?: string
  ): Promise<Conversation> => {
    const userId = axiosInstance.defaults.headers.common['X-User-ID'];
    const response = await axiosInstance.put(
      API_ENDPOINTS.UPDATE_GROUP(conversationId),
      { name, avatar },
      { params: { userId } }
    );
    return response.data.data;
  },

  // Leave group
  leaveGroup: async (conversationId: string): Promise<void> => {
    const userId = axiosInstance.defaults.headers.common['X-User-ID'];
    await axiosInstance.post(API_ENDPOINTS.LEAVE_GROUP(conversationId), null, {
      params: { userId },
    });
  },
};

// Message Request API
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

  getPendingMessages: async (senderId: string, receiverId: string): Promise<Message[]> => {
    const response = await axiosInstance.get(API_ENDPOINTS.MESSAGE_REQUESTS_PENDING_MESSAGES, {
      params: { senderId, receiverId },
    });
    return response.data.data;
  },

  acceptRequest: async (requestId: string): Promise<Conversation> => {
    const userId = axiosInstance.defaults.headers.common['X-User-ID'];
    const response = await axiosInstance.post(
      API_ENDPOINTS.ACCEPT_MESSAGE_REQUEST(requestId),
      null,
      { params: { userId } }
    );
    return response.data.data;
  },

  rejectRequest: async (requestId: string): Promise<void> => {
    const userId = axiosInstance.defaults.headers.common['X-User-ID'];
    await axiosInstance.post(API_ENDPOINTS.REJECT_MESSAGE_REQUEST(requestId), null, {
      params: { userId },
    });
  },

  ignoreRequest: async (requestId: string): Promise<void> => {
    const userId = axiosInstance.defaults.headers.common['X-User-ID'];
    await axiosInstance.post(API_ENDPOINTS.IGNORE_MESSAGE_REQUEST(requestId), null, {
      params: { userId },
    });
  },
};

// Notification API
export const notificationAPI = {
  getNotifications: async (page = 0, limit = 20): Promise<PaginatedResponse<Notification>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.NOTIFICATIONS, {
      params: { page, limit },
    });
    return response.data.data;
  },

  markAsRead: async (notificationId: string): Promise<void> => {
    await axiosInstance.put(API_ENDPOINTS.MARK_READ(notificationId));
  },

  deleteNotification: async (notificationId: string): Promise<void> => {
    await axiosInstance.delete(API_ENDPOINTS.DELETE_NOTIFICATION(notificationId));
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await axiosInstance.get(API_ENDPOINTS.UNREAD_COUNT);
    return response.data.data;
  },
};
