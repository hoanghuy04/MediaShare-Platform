import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Comment } from '@types';
import { useTheme } from '@hooks/useTheme';
import { Avatar } from '../common/Avatar';
import { formatDate } from '@utils/formatters';
import { Ionicons } from '@expo/vector-icons';

interface CommentSectionProps {
  comments: Comment[];
  onLikeComment?: (commentId: string) => void;
  onDeleteComment?: (commentId: string) => void;
  currentUserId?: string;
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  comments = [],
  onLikeComment,
  onDeleteComment,
  currentUserId,
}) => {
  const { theme } = useTheme();

  const renderComment = ({ item }: { item: Comment }) => (
    <View style={styles.commentItem}>
      <Avatar uri={item.author.profile?.avatar} name={item.author.username} size={32} />

      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text style={[styles.username, { color: theme.colors.text }]}>
            {item.author.username}
          </Text>
          <Text style={[styles.timestamp, { color: theme.colors.textSecondary }]}>
            {formatDate(item.createdAt)}
          </Text>
        </View>

        <Text style={[styles.commentText, { color: theme.colors.text }]}>{item.text}</Text>

        <View style={styles.commentActions}>
          <TouchableOpacity onPress={() => onLikeComment?.(item.id)} style={styles.likeButton}>
            <Ionicons
              name={item.isLiked ? 'heart' : 'heart-outline'}
              size={16}
              color={item.isLiked ? theme.colors.like : theme.colors.textSecondary}
            />
            {item.likesCount > 0 && (
              <Text style={[styles.likeCount, { color: theme.colors.textSecondary }]}>
                {item.likesCount}
              </Text>
            )}
          </TouchableOpacity>

          {currentUserId === item.author.id && (
            <TouchableOpacity onPress={() => onDeleteComment?.(item.id)}>
              <Ionicons name="trash-outline" size={16} color={theme.colors.danger} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.listContent}>
      {comments.map((comment, index) => (
        <View key={comment.id}>
          {renderComment({ item: comment })}
          {index < comments.length - 1 && <View style={styles.separator} />}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
  },
  commentItem: {
    flexDirection: 'row',
  },
  commentContent: {
    flex: 1,
    marginLeft: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  timestamp: {
    fontSize: 12,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 18,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 16,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  likeCount: {
    fontSize: 12,
  },
  separator: {
    height: 16,
  },
});
