import axiosInstance from '@config/axiosInstance';
import { API_ENDPOINTS } from '@config/routes';
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  UserProfile,
  UpdateProfileRequest,
  Post,
  CreatePostRequest,
  Comment,
  CreateCommentRequest,
  Conversation,
  Message,
  SendMessageRequest,
  Notification,
  PaginatedResponse,
  LikeResponse,
  FollowResponse,
} from '@types';

// Auth API
export const authAPI = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await axiosInstance.post(API_ENDPOINTS.LOGIN, data);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await axiosInstance.post(API_ENDPOINTS.REGISTER, data);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await axiosInstance.post(API_ENDPOINTS.LOGOUT);
  },

  getMe: async (): Promise<UserProfile> => {
    const response = await axiosInstance.get(API_ENDPOINTS.ME);
    return response.data;
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
    return response.data;
  },

  updateProfile: async (data: UpdateProfileRequest): Promise<UserProfile> => {
    const response = await axiosInstance.put(API_ENDPOINTS.UPDATE_PROFILE, data);
    return response.data;
  },

  searchUsers: async (query: string, page = 1, limit = 20): Promise<PaginatedResponse<UserProfile>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.USERS, {
      params: { search: query, page, limit },
    });
    return response.data;
  },

  followUser: async (userId: string): Promise<FollowResponse> => {
    const response = await axiosInstance.post(API_ENDPOINTS.FOLLOW(userId));
    return response.data;
  },

  unfollowUser: async (userId: string): Promise<FollowResponse> => {
    const response = await axiosInstance.delete(API_ENDPOINTS.UNFOLLOW(userId));
    return response.data;
  },

  getFollowers: async (userId: string, page = 1, limit = 20): Promise<PaginatedResponse<UserProfile>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.FOLLOWERS(userId), {
      params: { page, limit },
    });
    return response.data;
  },

  getFollowing: async (userId: string, page = 1, limit = 20): Promise<PaginatedResponse<UserProfile>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.FOLLOWING(userId), {
      params: { page, limit },
    });
    return response.data;
  },
};

// Post API
export const postAPI = {
  getFeed: async (page = 1, limit = 20): Promise<PaginatedResponse<Post>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.FEED, {
      params: { page, limit },
    });
    return response.data;
  },

  getExplorePosts: async (page = 1, limit = 20): Promise<PaginatedResponse<Post>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.EXPLORE, {
      params: { page, limit },
    });
    return response.data;
  },

  getPost: async (postId: string): Promise<Post> => {
    const response = await axiosInstance.get(API_ENDPOINTS.POST_DETAIL(postId));
    return response.data;
  },

  getUserPosts: async (userId: string, page = 1, limit = 20): Promise<PaginatedResponse<Post>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.USER_POSTS(userId), {
      params: { page, limit },
    });
    return response.data;
  },

  createPost: async (data: CreatePostRequest): Promise<Post> => {
    const response = await axiosInstance.post(API_ENDPOINTS.CREATE_POST, data);
    return response.data;
  },

  updatePost: async (postId: string, caption: string): Promise<Post> => {
    const response = await axiosInstance.put(API_ENDPOINTS.UPDATE_POST(postId), { caption });
    return response.data;
  },

  deletePost: async (postId: string): Promise<void> => {
    await axiosInstance.delete(API_ENDPOINTS.DELETE_POST(postId));
  },

  likePost: async (postId: string): Promise<LikeResponse> => {
    const response = await axiosInstance.post(API_ENDPOINTS.LIKE_POST(postId));
    return response.data;
  },

  unlikePost: async (postId: string): Promise<LikeResponse> => {
    const response = await axiosInstance.delete(API_ENDPOINTS.UNLIKE_POST(postId));
    return response.data;
  },
};

// Comment API
export const commentAPI = {
  getComments: async (postId: string, page = 1, limit = 20): Promise<PaginatedResponse<Comment>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.COMMENTS(postId), {
      params: { page, limit },
    });
    return response.data;
  },

  createComment: async (data: CreateCommentRequest): Promise<Comment> => {
    const response = await axiosInstance.post(
      API_ENDPOINTS.CREATE_COMMENT(data.postId),
      { content: data.content }
    );
    return response.data;
  },

  deleteComment: async (postId: string, commentId: string): Promise<void> => {
    await axiosInstance.delete(API_ENDPOINTS.DELETE_COMMENT(postId, commentId));
  },

  likeComment: async (postId: string, commentId: string): Promise<LikeResponse> => {
    const response = await axiosInstance.post(API_ENDPOINTS.LIKE_COMMENT(postId, commentId));
    return response.data;
  },
};

// Message API
export const messageAPI = {
  getConversations: async (page = 1, limit = 20): Promise<PaginatedResponse<Conversation>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.CONVERSATIONS, {
      params: { page, limit },
    });
    return response.data;
  },

  getConversation: async (conversationId: string): Promise<Conversation> => {
    const response = await axiosInstance.get(API_ENDPOINTS.CONVERSATION_DETAIL(conversationId));
    return response.data;
  },

  getMessages: async (
    conversationId: string,
    page = 1,
    limit = 50
  ): Promise<PaginatedResponse<Message>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.MESSAGES(conversationId), {
      params: { page, limit },
    });
    return response.data;
  },

  sendMessage: async (data: SendMessageRequest): Promise<Message> => {
    const response = await axiosInstance.post(
      API_ENDPOINTS.SEND_MESSAGE(data.conversationId),
      data
    );
    return response.data;
  },

  createConversation: async (participantIds: string[]): Promise<Conversation> => {
    const response = await axiosInstance.post(API_ENDPOINTS.CREATE_CONVERSATION, {
      participantIds,
    });
    return response.data;
  },
};

// Notification API
export const notificationAPI = {
  getNotifications: async (page = 1, limit = 20): Promise<PaginatedResponse<Notification>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.NOTIFICATIONS, {
      params: { page, limit },
    });
    return response.data;
  },

  markAsRead: async (notificationId: string): Promise<void> => {
    await axiosInstance.put(API_ENDPOINTS.MARK_READ(notificationId));
  },

  markAllAsRead: async (): Promise<void> => {
    await axiosInstance.put(API_ENDPOINTS.MARK_ALL_READ);
  },
};

// Upload API
export const uploadAPI = {
  uploadFile: async (file: FormData, type: 'profile' | 'cover' | 'post'): Promise<string> => {
    let endpoint = API_ENDPOINTS.UPLOAD;
    if (type === 'profile') endpoint = API_ENDPOINTS.UPLOAD_PROFILE_IMAGE;
    if (type === 'cover') endpoint = API_ENDPOINTS.UPLOAD_COVER_IMAGE;
    if (type === 'post') endpoint = API_ENDPOINTS.UPLOAD_POST_MEDIA;

    const response = await axiosInstance.post(endpoint, file, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.url;
  },
};

