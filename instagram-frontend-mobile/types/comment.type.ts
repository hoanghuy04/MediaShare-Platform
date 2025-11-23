import { PostLikeUserResponse } from "./post.type";

export interface CommentCreateRequest {
    text: string;
    parentCommentId?: string;
    mention?: string;
}

export interface CommentResponse {
    id: string;
    postId: string;
    authorCommentedPost: boolean;
    author: PostLikeUserResponse;
    text: string;
    totalLike: number;
    totalReply: number;
    createdAt: string;
    updatedAt: string;
    parentCommentId?: string;
    mention?: string;
    likedByCurrentUser: boolean;
    pinned: boolean;
}

export interface CommentPinToggleResponse {
    postId: string;
    commentId: string;
    pinned: boolean;
    totalPin: number;
}

export interface CommentLikeToggleResponse {
    postId: string;
    commentId: string;
    totalLikes: number;
    liked: boolean;
}