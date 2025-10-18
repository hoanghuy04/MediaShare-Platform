export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}

export interface UploadResponse {
  url: string;
  thumbnailUrl?: string;
  type: 'IMAGE' | 'VIDEO';
  width?: number;
  height?: number;
  duration?: number;
}

export interface Notification {
  id: string;
  type: 'LIKE' | 'COMMENT' | 'FOLLOW' | 'MENTION';
  userId: string;
  user: {
    id: string;
    username: string;
    profileImage?: string;
  };
  postId?: string;
  commentId?: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

