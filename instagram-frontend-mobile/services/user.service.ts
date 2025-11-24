import axiosInstance from '../config/axiosInstance';
import { API_ENDPOINTS } from '../config/routes';
import { UserResponse, UpdateUserRequest, UserStatsResponse, FollowToggleResponse } from '../types/user';
import { PaginatedResponse } from '../types';

export const userService = {

  getUserById: async (userId: string): Promise<UserResponse> => {
    const response = await axiosInstance.get(API_ENDPOINTS.USER_PROFILE(userId));
    return response.data.data;
  },


  updateUser: async (userId: string, data: UpdateUserRequest): Promise<UserResponse> => {
    const response = await axiosInstance.put(API_ENDPOINTS.UPDATE_PROFILE(userId), data);
    return response.data.data;
  },


  getUserStats: async (userId: string): Promise<UserStatsResponse> => {
    const response = await axiosInstance.get(`${API_ENDPOINTS.USERS}/${userId}/stats`);
    return response.data.data;
  },

  /**
   * Search users
   */
  searchUsers: async (
    query: string,
    page = 0,
    limit = 20
  ): Promise<PaginatedResponse<UserResponse>> => {
    const response = await axiosInstance.get(`${API_ENDPOINTS.USERS}/search`, {
      params: { query, page, size: limit },
    });
    return response.data.data;
  },

  /**
   * Get user followers
   */
  getUserFollowers: async (userId: string): Promise<UserResponse[]> => {
    const response = await axiosInstance.get(`${API_ENDPOINTS.USERS}/${userId}/followers`);
    return response.data.data;
  },

  getUserFollowing: async (userId: string): Promise<UserResponse[]> => {
    const response = await axiosInstance.get(`${API_ENDPOINTS.USERS}/${userId}/following`);
    return response.data.data;
  },

  toggleFollow: async (targetUserId: string): Promise<FollowToggleResponse> => {
    const response = await axiosInstance.post(API_ENDPOINTS.FOLLOW(targetUserId));
    return response.data.data;
  },

  isFollowing: async (targetUserId: string): Promise<boolean> => {
    const response = await axiosInstance.get(API_ENDPOINTS.IS_FOLLOWING(targetUserId));
    return response.data.data;
  },

  deleteUser: async (userId: string): Promise<void> => {
    await axiosInstance.delete(API_ENDPOINTS.DELETE_USER(userId));
  },
};
