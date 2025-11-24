import { PostType } from './enum.type';
import { MediaFileResponse } from './media.type';
import { UserSummaryResponse } from './user';

export interface CreatePostRequest {
  caption?: string;
  type: PostType;
  mediaFileIds: string[];
  tags: string[];
  location?: string;
}

export interface PostResponse {
  id: string;
  author: UserSummaryResponse;
  caption: string | null;
  type: PostType;
  media: MediaFileResponse[];
  totalLike: number;
  totalComment: number;
  tags: string[];
  location: string | null;
  likedByCurrentUser: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PostLikeToggleResponse {
  postId: string;
  liked: boolean;
}

export interface PostLikeUserResponse {
  id: string;
  username: string;
  avatarUrl: string;
}



