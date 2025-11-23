import axiosInstance from "../config/axiosInstance";
import { API_ENDPOINTS } from "../config/routes";
import { ApiResponse, PaginatedResponse } from "../types";
import { PostLikeToggleResponse, PostLikeUserResponse } from "../types/post.type";

export const postLikeService = {
    toggleLikePost: async (postId: string): Promise<PostLikeToggleResponse> => {
        try {
            const response = await axiosInstance.post(API_ENDPOINTS.TOGGLE_LIKE_POST(postId));
            return response.data;
        } catch (error: any) {
            console.error('[postLikeService] Error details:', {
                postId,
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                message: error.message,
            });
            const errorMsg = error.response?.data?.message || error.message || 'Failed to toggle like';
            throw new Error(errorMsg);
        }
    },

    getPostLikes: async (postId: string, page = 0, pageSize = 20, query = ''): Promise<PaginatedResponse<PostLikeUserResponse>> => {
        try {
            const response = await axiosInstance.get<ApiResponse<PaginatedResponse<PostLikeUserResponse>>>(
                API_ENDPOINTS.GET_POST_LIKES(postId),
                { params: { page, pageSize, query } }
            );
            return response.data.data;
        } catch (error: any) {
            console.error('[postLikeService] Failed to get post likes:', error);
            throw new Error(error.response?.data?.message || 'Failed to load likes');
        }
    },
};