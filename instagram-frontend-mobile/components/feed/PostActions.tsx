import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Post } from '@types';
import { useTheme } from '@hooks/useTheme';
import { formatNumber } from '@utils/formatters';

interface PostActionsProps {
  post: Post;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
}

export const PostActions: React.FC<PostActionsProps> = ({ post, onLike, onComment, onShare }) => {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.leftActions}>
        <TouchableOpacity onPress={onLike} style={styles.actionButton}>
          <Ionicons
            name={post.isLiked ? 'heart' : 'heart-outline'}
            size={28}
            color={post.isLiked ? theme.colors.like : theme.colors.text}
          />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={onComment} style={styles.actionButton}>
          <Ionicons name="chatbubble-outline" size={26} color={theme.colors.text} />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={onShare} style={styles.actionButton}>
          <Ionicons name="paper-plane-outline" size={26} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity>
        <Ionicons
          name={post.isSaved ? 'bookmark' : 'bookmark-outline'}
          size={26}
          color={theme.colors.text}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginRight: 16,
  },
});

