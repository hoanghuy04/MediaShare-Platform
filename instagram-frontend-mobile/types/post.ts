import { UserProfile } from './user';

export interface Post {
  id: string;
  author: UserProfile;
  caption: string;
  media: Media[];
  likesCount: number;
  commentsCount: number;
  sharesCount?: number;
  bookmarksCount?: number;
  tags?: string[];
  location?: string;
  isLikedByCurrentUser?: boolean;
  isSaved?: boolean; // Frontend-only property
  createdAt: string;
  updatedAt: string;
}

export interface Media {
  url: string;
  type: 'IMAGE' | 'VIDEO' | 'image' | 'video';
  uploadedAt?: string;
}

export interface CreatePostRequest {
  caption: string;
  media: Media[];
  tags?: string[];
  location?: string;
}

export interface UpdatePostRequest {
  caption?: string;
}

export interface Comment {
  id: string;
  postId: string;
  author: UserProfile;
  text: string;
  likesCount: number;
  repliesCount?: number;
  isLiked?: boolean; // Frontend-only property
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentRequest {
  postId: string;
  text: string;
}

export interface LikeResponse {
  success: boolean;
  isLiked: boolean;
  likesCount: number;
}
