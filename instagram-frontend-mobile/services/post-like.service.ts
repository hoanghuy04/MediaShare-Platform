import axiosInstance from "../config/axiosInstance";
import { API_ENDPOINTS } from "../config/routes";
import { PostLikeToggleResponse } from "../types/post.type";

export const postLikeService = {

    toggleLikePost: async (postId: string): Promise<PostLikeToggleResponse> => {
        try {
            console.log('[postLikeService] Toggling like for post:', postId);
            const response = await axiosInstance.post(API_ENDPOINTS.TOGGLE_LIKE_POST(postId));
            console.log('[postLikeService] Response:', response.data);
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
}