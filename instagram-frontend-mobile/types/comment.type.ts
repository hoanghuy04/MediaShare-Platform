import { PostLikeUserResponse } from "./post.type";

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
    likedByCurrentUser: boolean;
}

export interface CommentLikeToggleResponse {
    postId: string;
    commentId: string;
    totalLikes: number;
    liked: boolean;
}