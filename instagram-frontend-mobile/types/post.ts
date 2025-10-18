export interface Post {
  id: string;
  userId: string;
  user: {
    id: string;
    username: string;
    profileImage?: string;
  };
  caption: string;
  mediaFiles: MediaFile[];
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  isSaved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MediaFile {
  id: string;
  url: string;
  type: 'IMAGE' | 'VIDEO';
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  duration?: number;
}

export interface CreatePostRequest {
  caption: string;
  mediaFiles: MediaFile[];
}

export interface UpdatePostRequest {
  caption?: string;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  user: {
    id: string;
    username: string;
    profileImage?: string;
  };
  content: string;
  likesCount: number;
  isLiked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentRequest {
  postId: string;
  content: string;
}

export interface LikeResponse {
  success: boolean;
  isLiked: boolean;
  likesCount: number;
}

