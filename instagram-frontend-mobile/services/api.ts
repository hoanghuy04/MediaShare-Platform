import axiosInstance from '../config/axiosInstance';
import { API_ENDPOINTS } from '../config/routes';
import {
  UserProfile,
  UpdateProfileRequest,
  Post,
  Comment,
  CreateCommentRequest,
  Notification,
  PaginatedResponse,
  UserSummary,
} from '../types';
import { CreatePostRequest } from '../types/post.type';


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

  getFollowingSummary: async (
    userId: string,
    params?: { query?: string; page?: number; size?: number }
  ): Promise<UserSummary[]> => {
    const response = await axiosInstance.get(API_ENDPOINTS.FOLLOWING_SUMMARY(userId), {
      params: {
        query: params?.query ?? '',
        page: params?.page ?? 0,
        size: params?.size ?? 20,
      },
    });
    return response.data.data;
  },

  getMutualFollows: async (
    userId: string,
    query = '',
    page = 0,
    size = 20
  ): Promise<UserSummary[]> => {
    const mapToSummary = (user: UserProfile): UserSummary => ({
      id: user.id,
      username: user.username,
      avatar: user.profile?.avatar,
      isVerified: !!user.isVerified,
    });

    try {
      const response = await axiosInstance.get(API_ENDPOINTS.MUTUAL_FOLLOWS(userId), {
        params: { query, page, size },
      });
      return response.data.data;
    } catch (error) {
      console.warn('Mutual follows endpoint not available, falling back to client-side intersection');
      const [followers, following] = await Promise.all([
        userAPI.getFollowers(userId, 0, 100),
        userAPI.getFollowing(userId, 0, 100),
      ]);

      const followerIds = new Set(followers.map(u => u.id));
      let mutuals = following.filter(u => followerIds.has(u.id));

      if (query.trim()) {
        const lowerQuery = query.toLowerCase();
        mutuals = mutuals.filter(user => {
          const username = user.username?.toLowerCase() || '';
          const firstName = user.profile?.firstName?.toLowerCase() || '';
          const lastName = user.profile?.lastName?.toLowerCase() || '';
          return (
            username.includes(lowerQuery) ||
            firstName.includes(lowerQuery) ||
            lastName.includes(lowerQuery)
          );
        });
      }

      return mutuals.map(mapToSummary);
    }
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
  uploadFile: async (
    file: FormData,
    type: 'profile' | 'post',
    userId?: string
  ): Promise<string> => {
    let endpoint: string = API_ENDPOINTS.UPLOAD;
    if (type === 'profile') endpoint = API_ENDPOINTS.UPLOAD_PROFILE_IMAGE;
    if (type === 'post') endpoint = API_ENDPOINTS.UPLOAD_POST_MEDIA;

    // Append userId to FormData if provided
    if (userId) {
      file.append('userId', userId);
    }

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

