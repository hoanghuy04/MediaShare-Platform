import axiosInstance from "../config/axiosInstance";
import { API_ENDPOINTS } from "../config/routes";
import { ApiResponse, PaginatedResponse } from "../types";
import { CommentCreateRequest, CommentResponse, CommentLikeToggleResponse } from "../types/post.type";

export const postCommentService = {
    createComment: async (postId: string, data: CommentCreateRequest): Promise<CommentResponse> => {
        try {
            const response = await axiosInstance.post<ApiResponse<CommentResponse>>(
                API_ENDPOINTS.CREATE_COMMENT(postId),
                data
            );
            return response.data.data;
        } catch (error: any) {
            console.error('[postCommentService] Failed to create comment:', error);
            throw new Error(error.response?.data?.message || 'Failed to create comment');
        }
    },

    getComments: async (postId: string, page = 0, pageSize = 20): Promise<PaginatedResponse<CommentResponse>> => {
        try {
            const response = await axiosInstance.get<ApiResponse<PaginatedResponse<CommentResponse>>>(
                API_ENDPOINTS.GET_COMMENTS(postId),
                { params: { page, pageSize } }
            );
            return response.data.data;
        } catch (error: any) {
            console.error('[postCommentService] Failed to get comments:', error);
            throw new Error(error.response?.data?.message || 'Failed to load comments');
        }
    },

    getReplies: async (postId: string, commentId: string, page = 0, pageSize = 20): Promise<PaginatedResponse<CommentResponse>> => {
        try {
            const response = await axiosInstance.get<ApiResponse<PaginatedResponse<CommentResponse>>>(
                API_ENDPOINTS.GET_REPLIES(postId, commentId),
                { params: { page, pageSize } }
            );
            return response.data.data;
        } catch (error: any) {
            console.error('[postCommentService] Failed to get replies:', error);
            throw new Error(error.response?.data?.message || 'Failed to load replies');
        }
    },

    toggleLikeComment: async (postId: string, commentId: string): Promise<CommentLikeToggleResponse> => {
        try {
            const response = await axiosInstance.post<ApiResponse<CommentLikeToggleResponse>>(
                API_ENDPOINTS.TOGGLE_LIKE_COMMENT(postId, commentId)
            );
            return response.data.data;
        } catch (error: any) {
            console.error('[postCommentService] Failed to toggle like comment:', error);
            throw new Error(error.response?.data?.message || 'Failed to toggle like');
        }
    },
};
