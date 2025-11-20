import { PostType } from './enum.type';
import { MediaFileResponse } from './media.type';
import { UserResponse } from './user';

export interface CreatePostRequest {
  caption?: string;
  type: PostType;
  mediaFileIds: string[];
  tags: string[];
  location?: string;
}

export interface PostResponse {
  id: string;
  author: UserResponse;
  caption: string | null;
  type: PostType;
  media: MediaFileResponse[];
  likesCount: number;
  commentsCount: number;
  tags: string[];
  location: string | null;
  isLikedByCurrentUser: boolean;
  createdAt: string;
  updatedAt: string;
}
