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
  isSaved?: boolean;
  createdAt: string;
  updatedAt: string;
  type?: 'FEED' | 'REEL' | 'STORY';
}

export interface Media {
  url: string;
  type: 'IMAGE' | 'VIDEO' | 'image' | 'video' | 'REEL';
  uploadedAt?: string;
}

export interface UpdatePostRequest {
  caption?: string;
}

export interface LikeResponse {
  success: boolean;
  isLiked: boolean;
  likesCount: number;
}
