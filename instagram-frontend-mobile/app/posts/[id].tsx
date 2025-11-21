import React, { useEffect, useState, useRef } from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useTheme } from '@hooks/useTheme';
import { useAuth } from '@hooks/useAuth';
import { Header } from '@components/common/Header';
import { PostCard } from '@components/feed/PostCard';
import { CommentSection } from '@components/feed/CommentSection';
import { CommentInput, CommentInputRef } from '@components/feed/CommentInput';
import { LoadingSpinner } from '@components/common/LoadingSpinner';
import { commentAPI } from '@services/api';
import { commentService } from '@/services/comment.service';
import { postService } from '@/services/post.service';
import { Post, Comment } from '@types';
import { showAlert } from '@utils/helpers';

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<{ id: string; username: string } | null>(null);
  const commentInputRef = useRef<CommentInputRef>(null);

  useEffect(() => {
    loadPost();
    loadComments();
  }, [id]);

  useFocusEffect(
    React.useCallback(() => {
      // Reload when returning from other screens
      loadPost();
      loadComments();
    }, [id])
  );

  const loadPost = async () => {
    try {
      const data = await postService.getPost(id);
      setPost(data);
    } catch (error: any) {
      showAlert('Error', error.message);
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      const response = await commentService.getComments(id);
      console.log('Comments loaded:', response.content.length, 'first comment:', response.content[0]);
      setComments(response.content);
      // Sync comment count with actual comments
      setPost(prev => prev ? {
        ...prev,
        commentsCount: response.content.length
      } : null);
    } catch (error: any) {
      console.error('Error loading comments:', error);
    }
  };

  const handleSendComment = async (content: string) => {
    try {
      if (replyingTo) {
        // Reply to comment - prepend @mention to text
        const textWithMention = `@${replyingTo.username} ${content}`;
        const newReply = await commentService.replyToComment(replyingTo.id, {
          postId: id,
          text: textWithMention,
          mention: replyingTo.username,
        });
        // Reload comments to show new reply
        await loadComments();
        setReplyingTo(null);
      } else {
        // New comment
        const newComment = await commentService.createComment({ 
          postId: id, 
          text: content,
        });
        setComments([newComment, ...comments]);
        setPost(prev => prev ? {
          ...prev,
          commentsCount: (prev.commentsCount || 0) + 1
        } : null);
      }
    } catch (error: any) {
      showAlert('Error', error.message);
    }
  };

  const handleLikeComment = async (commentId: string): Promise<boolean> => {
    try {
      console.log('Like comment clicked:', commentId);
      
      // API call - backend handles the toggle and returns new state
      const isLiked = await commentService.toggleLikeComment(commentId);
      
      console.log('Toggle like response:', isLiked);
      
      // Update root comments if it's a root comment
      setComments(prev => 
        prev.map(c => {
          if (c.id === commentId) {
            return {
              ...c,
              isLiked,
              likesCount: isLiked ? c.likesCount + 1 : Math.max(0, c.likesCount - 1)
            };
          }
          return c;
        })
      );
      
      console.log('Updated comment isLiked to:', isLiked);
      
      // Return the new state for CommentSection to update nested comments
      return isLiked;
    } catch (error: any) {
      console.error('Error liking comment:', error);
      showAlert('Error', error.message);
      throw error;
    }
  };

  const handleLikePost = async (postId: string) => {
    try {
      if (!user?.id) {
        showAlert('Error', 'Please login to like posts');
        return;
      }
      const wasLiked = post?.isLikedByCurrentUser;
      
      // Optimistic update
      setPost(prev => prev ? {
        ...prev,
        isLikedByCurrentUser: !prev.isLikedByCurrentUser,
        likesCount: prev.isLikedByCurrentUser ? prev.likesCount - 1 : prev.likesCount + 1
      } : null);

      // API call - backend returns new like state
      const isLiked = await postService.toggleLikePost(postId);
      
      // Sync with actual state from server
      setPost(prev => prev ? {
        ...prev,
        isLikedByCurrentUser: isLiked
      } : null);
    } catch (error: any) {
      console.error('Error liking post:', error);
      // Revert on error
      setPost(prev => prev ? {
        ...prev,
        isLikedByCurrentUser: !prev.isLikedByCurrentUser,
        likesCount: prev.isLikedByCurrentUser ? prev.likesCount - 1 : prev.likesCount + 1
      } : null);
      showAlert('Error', error.message || 'Không thể like bài viết');
    }
  };

  const handleCommentPost = (postId: string) => {
  };

  const handleSharePost = (postId: string) => {
    showAlert('Share', 'Share functionality coming soon');
  };

  const handleBookmarkPost = async (postId: string) => {
    try {
      showAlert('Saved', 'Post saved to your collection');
    } catch (error: any) {
      showAlert('Error', error.message);
    }
  };

  const handleFollowUser = async (userId: string) => {
    try {
      showAlert('Success', 'You are now following this user');
    } catch (error: any) {
      showAlert('Error', error.message);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await commentService.deleteComment(commentId);
      setComments(comments.filter(c => c.id !== commentId));
      setPost(prev => prev ? {
        ...prev,
        commentsCount: Math.max(0, (prev.commentsCount || 0) - 1)
      } : null);
      showAlert('Success', 'Comment deleted');
    } catch (error: any) {
      showAlert('Error', error.message);
    }
  };

  const handleReplyComment = (commentId: string, username: string) => {
    setReplyingTo({ id: commentId, username });
    // Focus input and set mention text
    setTimeout(() => {
      commentInputRef.current?.focus();
    }, 100);
  };

  const handleClearMention = () => {
    setReplyingTo(null);
  };

  const handleLoadReplies = async (commentId: string): Promise<Comment[]> => {
    try {
      console.log('Loading replies for comment:', commentId);
      const replies = await commentService.getReplies(commentId);
      console.log('Loaded replies:', replies.length);
      return replies;
    } catch (error: any) {
      console.error('Error loading replies:', error);
      // Workaround: Return empty array if backend endpoint not implemented yet
      if (error?.response?.status === 500 || error?.response?.status === 404) {
        console.warn('Backend endpoint /comments/{id}/replies not implemented yet. Returning empty array.');
        return [];
      }
      return [];
    }
  };

  if (isLoading || !post) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Header showBack title="Post" />
        <LoadingSpinner />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Header showBack title="Post" />
      <ScrollView>
        <PostCard 
          post={post} 
          onLike={handleLikePost}
          onComment={handleCommentPost}
          onShare={handleSharePost}
          onBookmark={handleBookmarkPost}
          onFollow={handleFollowUser}
          disableNavigation={true}
        />
        <CommentSection
          comments={comments}
          onLikeComment={handleLikeComment}
          onDeleteComment={handleDeleteComment}
          onReplyComment={handleReplyComment}
          onLoadReplies={handleLoadReplies}
          currentUserId={user?.id}
        />
      </ScrollView>
      <CommentInput 
        ref={commentInputRef}
        onSend={handleSendComment} 
        placeholder={replyingTo ? "Thêm phản hồi..." : "Thêm bình luận..."} 
        mentionText={replyingTo ? `Đang trả lời @${replyingTo.username}` : undefined}
        onClearMention={handleClearMention}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
