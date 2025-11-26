/**
 * Notification types matching backend enum
 */
export type NotificationType =
    | 'FOLLOW'
    | 'LIKE_POST'
    | 'COMMENT_POST'
    | 'LIKE_COMMENT'
    | 'TAG_IN_POST'
    | 'TAG_IN_COMMENT'
    | 'NEW_MESSAGE'
    | 'SYSTEM';

/**
 * User summary for notifications
 */
export interface UserSummaryResponse {
    id: string;
    username: string;
    avatar?: string;
}

/**
 * Notification response from API (matches backend NotificationResponse.java)
 */
export interface NotificationResponse {
    id: string;
    type: NotificationType;
    senderId: string;
    postId?: string;
    author?: UserSummaryResponse;
    content: string;
    postThumbnail?: string;
    createdAt: string; // ISO string or formatted time from backend
    read: boolean;
    isFollowingBack: boolean;
    isLikeComment: boolean;
}

/**
 * Page response wrapper
 */
export interface PageResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
    first: boolean;
    last: boolean;
}
