import axiosInstance from '../config/axiosInstance';
import { ApiResponse, PaginatedResponse } from '../types';
import { MentionUserResponse } from '../types/mention.type';

export const mentionService = {
    searchUsers: async (query: string, page: number = 0, size: number = 20) => {
        console.log('[MentionService] Searching users with query:', query, 'page:', page, 'size:', size);
        const response = await axiosInstance.get<ApiResponse<PaginatedResponse<MentionUserResponse>>>(
            '/api/mentions/search',
            {
                params: {
                    q: query,
                    page,
                    size,
                },
            }
        );
        console.log('[MentionService] Search response:', response.data);
        return response.data.data;
    },
};

