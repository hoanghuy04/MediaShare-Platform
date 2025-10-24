import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@hooks/useTheme';
import { useAuth } from '@hooks/useAuth';
import { Header } from '@components/common/Header';
import { PostCard } from '@components/feed/PostCard';
import { CommentSection } from '@components/feed/CommentSection';
import { MessageInput } from '@components/messages/MessageInput';
import { LoadingSpinner } from '@components/common/LoadingSpinner';
import { postAPI, commentAPI } from '@services/api';
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

  useEffect(() => {
    loadPost();
    loadComments();
  }, [id]);

  const loadPost = async () => {
    try {
      const data = await postAPI.getPost(id);
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
      const response = await commentAPI.getComments(id);
      setComments(response.content);
    } catch (error: any) {
      console.error('Error loading comments:', error);
    }
  };

  const handleSendComment = async (content: string) => {
    try {
      const newComment = await commentAPI.createComment({ postId: id, content });
      setComments([newComment, ...comments]);
    } catch (error: any) {
      showAlert('Error', error.message);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    try {
      await commentAPI.likeComment(id, commentId);
      // TODO: Update comment in local state
    } catch (error: any) {
      showAlert('Error', error.message);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await commentAPI.deleteComment(id, commentId);
      setComments(comments.filter(c => c.id !== commentId));
    } catch (error: any) {
      showAlert('Error', error.message);
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
        <PostCard post={post} />
        <CommentSection
          comments={comments}
          onLikeComment={handleLikeComment}
          onDeleteComment={handleDeleteComment}
          currentUserId={user?.id}
        />
      </ScrollView>
      <MessageInput onSend={handleSendComment} placeholder="Add a comment..." />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
