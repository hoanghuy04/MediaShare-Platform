import axiosInstance from '../config/axiosInstance';
import { API_ENDPOINTS } from '../config/routes';
import { HashtagResponse, HashtagRequest } from '../types/hashtag.type';

export const hashtagService = {
  createHashtag: async (request: HashtagRequest): Promise<HashtagResponse> => {
    try {
      const response = await axiosInstance.post(API_ENDPOINTS.HASHTAGS, request);
      return response.data.data;
    } catch (error: any) {
      console.error('[hashtagService] Create hashtag error:', error);
      throw error;
    }
  },

  getByTag: async (tag: string): Promise<HashtagResponse> => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.HASHTAG_BY_TAG(tag));
      return response.data.data;
    } catch (error: any) {
      console.error('[hashtagService] Get by tag error:', error);
      throw error;
    }
  },

  search: async (keyword: string): Promise<HashtagResponse[]> => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.HASHTAG_SEARCH, {
        params: { keyword },
      });
      return response.data.data;
    } catch (error: any) {
      console.error('[hashtagService] Search error:', error);
      // Return empty array on error instead of throwing
      return [];
    }
  },

  increaseUsage: async (tag: string): Promise<HashtagResponse> => {
    try {
      const response = await axiosInstance.post(API_ENDPOINTS.HASHTAG_INCREASE(tag));
      return response.data.data;
    } catch (error: any) {
      console.error('[hashtagService] Increase usage error:', error);
      throw error;
    }
  },

  getTrending: async (limit: number = 20): Promise<HashtagResponse[]> => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.HASHTAG_TRENDING, {
        params: { limit },
      });
      return response.data.data;
    } catch (error: any) {
      console.error('[hashtagService] Get trending error:', error);
      // Return empty array on error instead of throwing
      return [];
    }
  },
};
