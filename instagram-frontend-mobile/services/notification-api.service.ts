import axiosInstance from '../config/axiosInstance';
import { NotificationResponse, PageResponse } from '../types/notification';

export const notificationApiService = {
    /**
     * Get paginated notifications for the current user
     */
    async getNotifications(page: number = 0, size: number = 20): Promise<PageResponse<NotificationResponse>> {
        const response = await axiosInstance.get<{ data: PageResponse<NotificationResponse> }>('/api/notifications', {
            params: { page, size, sort: 'createdAt,desc' },
        });
        return response.data.data;
    },

    /**
     * Mark notification as read
     */
    async markAsRead(notificationId: string): Promise<void> {
        await axiosInstance.post(`/api/notifications/${notificationId}/read`);
    },

    /**
     * Mark all notifications as read
     */
    async markAllAsRead(): Promise<void> {
        await axiosInstance.post('/api/notifications/read-all');
    },

    /**
     * Get unread notification count
     */
    async getUnreadCount(): Promise<{ total: number; byType: Record<string, number> }> {
        const response = await axiosInstance.get<{ data: { total: number; byType: Record<string, number> } }>('/api/notifications/unread-count');
        return response.data.data;
    },
};
