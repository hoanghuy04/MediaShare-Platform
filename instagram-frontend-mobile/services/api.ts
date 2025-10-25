import axiosInstance from '../config/axiosInstance';
import { API_ENDPOINTS } from '../config/routes';
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
  SendMessageData,
  Notification,
  PaginatedResponse,
} from '../types';
import apiConfig from '../config/apiConfig';

// Auth API
export const authAPI = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    console.log('API URL:', apiConfig.apiUrl);
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
    console.log('Search Users Response:', response.data);

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

// Post API
export const postAPI = {
  getFeed: async (page = 0, limit = 20): Promise<PaginatedResponse<Post>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.FEED, {
      params: { page, limit },
    });
    return response.data.data;
  },

  getExplorePosts: async (page = 0, limit = 20): Promise<PaginatedResponse<Post>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.EXPLORE, {
      params: { page, limit },
    });
    return response.data.data;
  },

  getPost: async (postId: string): Promise<Post> => {
    const response = await axiosInstance.get(API_ENDPOINTS.POST_DETAIL(postId));
    return response.data.data;
  },

  getUserPosts: async (userId: string, page = 0, limit = 20): Promise<PaginatedResponse<Post>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.USER_POSTS(userId), {
      params: { page, limit },
    });
    return response.data.data;
  },

  createPost: async (data: CreatePostRequest): Promise<Post> => {
    const response = await axiosInstance.post(API_ENDPOINTS.CREATE_POST, data);
    return response.data.data;
  },

  updatePost: async (postId: string, caption: string): Promise<Post> => {
    const response = await axiosInstance.put(API_ENDPOINTS.UPDATE_POST(postId), { caption });
    return response.data.data;
  },

  deletePost: async (postId: string): Promise<void> => {
    await axiosInstance.delete(API_ENDPOINTS.DELETE_POST(postId));
  },

  likePost: async (postId: string): Promise<void> => {
    await axiosInstance.post(API_ENDPOINTS.LIKE_POST(postId));
  },

  unlikePost: async (postId: string): Promise<void> => {
    await axiosInstance.delete(API_ENDPOINTS.UNLIKE_POST(postId));
  },

  searchPosts: async (query: string, page = 0, limit = 20): Promise<PaginatedResponse<Post>> => {
    try {
      // Try to use dedicated search endpoint if available
      const response = await axiosInstance.get('/api/posts/search', {
        params: { query, page, limit },
      });
      return response.data.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        // Fallback to explore posts if search endpoint doesn't exist
        console.log('Search posts endpoint not found, using explore posts as fallback');
        return await postAPI.getExplorePosts(page, limit);
      }
      throw error;
    }
  },

  searchReels: async (query: string, page = 0, limit = 20): Promise<PaginatedResponse<Post>> => {
    try {
      // Try to use dedicated search endpoint if available
      // const response = await axiosInstance.get('/api/posts/search/reels', {
      const response = await axiosInstance.get('/api/posts/search', {
        params: { query, page, limit },
      });
      return response.data.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log('Search reels endpoint not found, using explore posts as fallback');
        const exploreResponse = await postAPI.getExplorePosts(page, limit);
        // Filter for video posts (reels)
        const videoPosts = exploreResponse.content.filter(post =>
          post.media.some(media => media.type === 'VIDEO' || media.type === 'video')
        );
        return {
          ...exploreResponse,
          content: videoPosts,
        };
      }
      throw error;
    }
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
    return response.data.data;
  },

  createComment: async (data: CreateCommentRequest): Promise<Comment> => {
    const response = await axiosInstance.post(API_ENDPOINTS.CREATE_COMMENT, {
      postId: data.postId,
      text: data.text,
    });
    return response.data.data;
  },

  updateComment: async (commentId: string, text: string): Promise<Comment> => {
    const response = await axiosInstance.put(API_ENDPOINTS.UPDATE_COMMENT(commentId), null, {
      params: { text },
    });
    return response.data.data;
  },

  deleteComment: async (commentId: string): Promise<void> => {
    await axiosInstance.delete(API_ENDPOINTS.DELETE_COMMENT(commentId));
  },

  likeComment: async (commentId: string): Promise<void> => {
    await axiosInstance.post(API_ENDPOINTS.LIKE_COMMENT(commentId));
  },

  unlikeComment: async (commentId: string): Promise<void> => {
    await axiosInstance.delete(API_ENDPOINTS.UNLIKE_COMMENT(commentId));
  },

  replyToComment: async (commentId: string, text: string): Promise<Comment> => {
    const response = await axiosInstance.post(`/api/comments/${commentId}/replies`, { text });
    return response.data.data;
  },
};

// Message API
export const messageAPI = {
  getConversations: async (page = 0, limit = 20): Promise<PaginatedResponse<Conversation>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.CONVERSATIONS, {
      params: { page, limit },
    });
    return response.data.data;
  },

  getConversation: async (conversationId: string): Promise<PaginatedResponse<Message>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.CONVERSATION_DETAIL(conversationId));
    return response.data.data;
  },

  getMessages: async (
    conversationId: string,
    page = 0,
    limit = 50
  ): Promise<PaginatedResponse<Message>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.MESSAGES(conversationId), {
      params: { page, limit },
    });
    return response.data.data;
  },

  sendMessage: async (data: SendMessageRequest): Promise<Message> => {
    const response = await axiosInstance.post(API_ENDPOINTS.SEND_MESSAGE, data);
    return response.data.data;
  },

  createConversation: async (participantIds: string[]): Promise<Conversation> => {
    const response = await axiosInstance.post(API_ENDPOINTS.CREATE_CONVERSATION, {
      participantIds,
    });
    return response.data.data;
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

// Upload API
export const uploadAPI = {
  uploadFile: async (file: FormData, type: 'profile' | 'post'): Promise<string> => {
    let endpoint: string = API_ENDPOINTS.UPLOAD;
    if (type === 'profile') endpoint = API_ENDPOINTS.UPLOAD_PROFILE_IMAGE;
    if (type === 'post') endpoint = API_ENDPOINTS.UPLOAD_POST_MEDIA;

    const response = await axiosInstance.post(endpoint, file, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  uploadMultipleFiles: async (files: FormData): Promise<string[]> => {
    const response = await axiosInstance.post(API_ENDPOINTS.UPLOAD_POST_MEDIA_BATCH, files, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  deleteFile: async (fileId: string): Promise<void> => {
    await axiosInstance.delete(API_ENDPOINTS.DELETE_FILE(fileId));
  },
};
