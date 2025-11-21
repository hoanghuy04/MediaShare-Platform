import { commentAPI } from './api';
import { Comment, CreateCommentRequest, PaginatedResponse } from '@types';

/**
 * Comment service with enhanced mention handling
 */
class CommentService {
  /**
   * Get comments for a post (root comments only)
   */
  async getComments(
    postId: string,
    page = 0,
    limit = 20
  ): Promise<PaginatedResponse<Comment>> {
    return commentAPI.getComments(postId, page, limit);
  }

  /**
   * Get replies for a specific comment
   */
  async getReplies(commentId: string): Promise<Comment[]> {
    return commentAPI.getReplies(commentId);
  }

  /**
   * Create a root comment
   */
  async createComment(data: CreateCommentRequest): Promise<Comment> {
    return commentAPI.createComment(data);
  }

  /**
   * Reply to a comment with automatic mention handling
   */
  async replyToComment(
    parentCommentId: string, 
    data: CreateCommentRequest
  ): Promise<Comment> {
    return commentAPI.replyToComment(parentCommentId, data);
  }

  /**
   * Update comment text
   */
  async updateComment(commentId: string, text: string): Promise<Comment> {
    return commentAPI.updateComment(commentId, text);
  }

  /**
   * Delete a comment
   */
  async deleteComment(commentId: string): Promise<void> {
    return commentAPI.deleteComment(commentId);
  }

  /**
   * Toggle like on comment
   */
  async toggleLikeComment(commentId: string): Promise<boolean> {
    return commentAPI.toggleLikeComment(commentId);
  }
}

export const commentService = new CommentService();
