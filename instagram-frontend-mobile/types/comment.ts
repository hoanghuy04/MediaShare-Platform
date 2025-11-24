import { UserSummaryResponse } from './user';

export interface Comment {
  id: string;
  postId: string;
  parentCommentId?: string | null;
  author: UserSummaryResponse;
  text: string;
  mention?: string;
  likesCount: number;
  repliesCount?: number;
  isLiked?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentRequest {
  postId: string;
  text: string;
  mention?: string;
}

export interface UpdateCommentRequest {
  text: string;
}
