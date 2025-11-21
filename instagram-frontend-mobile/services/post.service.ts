import { get } from 'react-native/Libraries/TurboModule/TurboModuleRegistry';
import axiosInstance from '../config/axiosInstance';
import { API_ENDPOINTS } from '../config/routes';
import { PaginatedResponse, Post } from '../types';
import { CreatePostRequest, PostResponse } from '../types/post.type';

export const postService = {
  getFeed: async (page = 0, limit = 20): Promise<PaginatedResponse<Post>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.FEED, {
      params: { page, limit },
    });
    console.log('[getFeed] Sample post:', response.data.data.content[0]);
    // Map backend field names to frontend
    const mappedContent = response.data.data.content.map((post: any) => ({
      ...post,
      isLikedByCurrentUser: post.likedByCurrentUser,
    }));
    return {
      ...response.data.data,
      content: mappedContent,
    };
  },

  getReels: async (page = 0, limit = 20): Promise<PaginatedResponse<PostResponse>> => {
    const response = await axiosInstance.get<PaginatedResponse<PostResponse>>(API_ENDPOINTS.REELS, {
      params: { page, limit },
    });
    console.log('Reels response data:', response.data);
    return response.data;
  },

  getExplorePosts: async (page = 0, limit = 20): Promise<PaginatedResponse<Post>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.EXPLORE, {
      params: { page, limit },
    });
    const mappedContent = response.data.data.content.map((post: any) => ({
      ...post,
      isLikedByCurrentUser: post.likedByCurrentUser,
    }));
    return {
      ...response.data.data,
      content: mappedContent,
    };
  },

  getPost: async (postId: string): Promise<Post> => {
    const response = await axiosInstance.get(API_ENDPOINTS.POST_DETAIL(postId));
    const post = response.data.data;
    return {
      ...post,
      isLikedByCurrentUser: post.likedByCurrentUser,
    };
  },

  getUserPosts: async (userId: string, page = 0, limit = 20): Promise<PaginatedResponse<Post>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.USER_POSTS(userId), {
      params: { page, limit },
    });
    const mappedContent = response.data.data.content.map((post: any) => ({
      ...post,
      isLikedByCurrentUser: post.likedByCurrentUser,
    }));
    return {
      ...response.data.data,
      content: mappedContent,
    };
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

  toggleLikePost: async (postId: string): Promise<boolean> => {
    try {
      const response = await axiosInstance.post(API_ENDPOINTS.TOGGLE_LIKE_POST(postId));
      return response.data.data; // Returns true if liked, false if unliked
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to toggle like';
      throw new Error(errorMsg);
    }
  },

  searchPosts: async (query: string, page = 0, limit = 20): Promise<PaginatedResponse<Post>> => {
    try {
      const response = await axiosInstance.get('/api/posts/search', {
        params: { query, page, limit },
      });
      return response.data.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log('Search posts endpoint not found, using explore posts as fallback');
        return await postService.getExplorePosts(page, limit);
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
        const exploreResponse = await postService.getExplorePosts(page, limit);
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
