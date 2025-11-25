import { get } from 'react-native/Libraries/TurboModule/TurboModuleRegistry';
import axiosInstance from '../config/axiosInstance';
import { API_ENDPOINTS } from '../config/routes';
import { PaginatedResponse, Post } from '../types';
import { CreatePostRequest, PostResponse, PostLikeToggleResponse } from '../types/post.type';

export const postService = {
  getFeed: async (page = 0, limit = 20): Promise<PaginatedResponse<PostResponse>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.FEED, {
      params: { page, limit },
    });
    return response.data.data;
  },

  getReels: async (page = 0, limit = 20): Promise<PaginatedResponse<PostResponse>> => {
    const response = await axiosInstance.get<PaginatedResponse<PostResponse>>(API_ENDPOINTS.REELS, {
      params: { page, limit },
    });
    return response.data;
  },

  getExplorePosts: async (page = 0, limit = 20): Promise<PaginatedResponse<Post>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.EXPLORE, {
      params: { page, limit },
    });
    const mappedContent = response.data.data.content.map((post: any) => ({
      ...post,
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

  getPostById: async (postId: string): Promise<PostResponse> => {
    const response = await axiosInstance.get(API_ENDPOINTS.POST_DETAIL(postId));
    return response.data.data;
  },

  getUserPosts: async (userId: string, page = 0, limit = 20): Promise<PaginatedResponse<PostResponse>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.USER_POSTS(userId), {
      params: { page, size: limit },
    });
    // Filter for FEED type posts only
    const allPosts = response.data.data;
    const feedPosts = allPosts.content.filter((post: Post) => post.type === 'FEED');
    return {
      ...allPosts,
      content: feedPosts,
    };
  },

  getUserReels: async (userId: string, page = 0, limit = 20): Promise<PaginatedResponse<Post>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.USER_POSTS(userId), {
      params: { page, size: limit },
    });
    // Filter for REEL type posts only
    const allPosts = response.data.data;
    const reels = allPosts.content.filter((post: Post) => post.type === 'REEL');
    return {
      ...allPosts,
      content: reels,
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

  searchPosts: async (query: string, page = 0, limit = 20): Promise<PaginatedResponse<Post>> => {
    try {
      const response = await axiosInstance.get('/api/posts/search', {
        params: { query, page, limit },
      });
      return response.data.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return postService.getExplorePosts(page, limit);
        throw error;
      }
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
