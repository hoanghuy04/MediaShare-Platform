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

export interface CommentCreateRequest {
  text: string;
  parentCommentId?: string;
  mention?: string;
}

export interface CommentResponse {
  id: string;
  postId: string;
  author: PostLikeUserResponse;
  text: string;
  totalLike: number;
  totalReply: number;
  createdAt: string;
  updatedAt: string;
  parentCommentId?: string;
  mention?: string;
  isLikedByCurrentUser: boolean;
}

export interface CommentLikeToggleResponse {
  postId: string;
  commentId: string;
  totalLikes: number;
  liked: boolean;
}

