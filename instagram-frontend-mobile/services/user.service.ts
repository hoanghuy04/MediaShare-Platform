import axiosInstance from '../config/axiosInstance';
import { API_ENDPOINTS } from '../config/routes';
import { UserResponse, UpdateUserRequest, UserStatsResponse, FollowToggleResponse, FollowerUserResponse, SimpleUserResponse, UserSummaryResponse } from '../types/user';
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
  getUserFollowers: async (userId: string): Promise<PaginatedResponse<UserResponse>> => {
    const response = await axiosInstance.get(`${API_ENDPOINTS.USERS}/${userId}/followers`);
    return response.data.data;
  },

  getUserFollowing: async (userId: string): Promise<PaginatedResponse<UserResponse>> => {
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

  /**
   * Search followers with username filter
   */
  searchFollowers: async (
    userId: string,
    username?: string,
    page = 0,
    size = 20,
    sortDirection: 'ASC' | 'DESC' = 'DESC'
  ): Promise<PaginatedResponse<FollowerUserResponse>> => {
    const response = await axiosInstance.get(`${API_ENDPOINTS.FOLLOWERS(userId)}`, {
      params: {
        username: username || '',
        page,
        size,
        sort: `createdAt,${sortDirection}`,
      },
    });
    return response.data.data;
  },

  /**
   * Search following with username filter and sorting
   */
  searchFollowing: async (
    userId: string,
    username?: string,
    page = 0,
    size = 20,
    sortDirection: 'ASC' | 'DESC' = 'DESC'
  ): Promise<PaginatedResponse<SimpleUserResponse>> => {
    const response = await axiosInstance.get(`${API_ENDPOINTS.FOLLOWING(userId)}`, {
      params: {
        username: username || '',
        page,
        size,
        sort: `createdAt,${sortDirection}`,
      },
    });
    console.log(response.data.data)
    return response.data.data;
  },

  deleteUser: async (userId: string): Promise<void> => {
    await axiosInstance.delete(API_ENDPOINTS.DELETE_USER(userId));
  },

  removeFollower: async (followerId: string): Promise<void> => {
    await axiosInstance.delete(API_ENDPOINTS.REMOVE_FOLLOWER(followerId));
  },

  getMutualFollows: async (
    userId: string,
    query = '',
    page = 0,
    size = 20
  ): Promise<UserSummaryResponse[]> => {
    const mapToSummary = (user: UserResponse): UserSummaryResponse => ({
      id: user.id,
      username: user.username,
      email: user.email,
      profile: user.profile,
      isVerified: !!user.isVerified,
      followingByCurrentUser: user.followingByCurrentUser ?? false,
    });

    try {
      const response = await axiosInstance.get(API_ENDPOINTS.MUTUAL_FOLLOWS(userId), {
        params: { query, page, size },
      });
      return response.data.data;
    } catch (error) {
      console.warn('Mutual follows endpoint not available, falling back to client-side intersection');
      const [followers, following]: [UserResponse[], UserResponse[]] = await Promise.all([
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
};
