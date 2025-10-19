import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Post } from '@types';
import { useTheme } from '@hooks/useTheme';
import { Avatar } from '../common/Avatar';
import { formatDate } from '@utils/formatters';
import { PostActions } from './PostActions';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PostCardProps {
  post: Post;
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onLike, onComment, onShare }) => {
  const { theme } = useTheme();
  const router = useRouter();

  const handleUserPress = () => {
    router.push(`/users/${post.author.id}`);
  };

  const handlePostPress = () => {
    router.push(`/posts/${post.id}`);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleUserPress} style={styles.userInfo}>
          <Avatar 
            uri={post.author.profile?.avatar} 
            name={post.author.username} 
            size={32} 
          />
          <Text style={[styles.username, { color: theme.colors.text }]}>
            {post.author.username}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity>
          <Ionicons name="ellipsis-vertical" size={20} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      {/* Media */}
      {post.media && post.media.length > 0 && (
        <TouchableOpacity onPress={handlePostPress} activeOpacity={0.95}>
          <Image
            source={{ uri: post.media[0].url }}
            style={styles.media}
            resizeMode="cover"
          />
        </TouchableOpacity>
      )}

      {/* Actions */}
      <PostActions
        post={post}
        onLike={() => onLike?.(post.id)}
        onComment={() => onComment?.(post.id)}
        onShare={() => onShare?.(post.id)}
      />

      {/* Caption */}
      {post.caption && (
        <View style={styles.captionContainer}>
          <Text style={{ color: theme.colors.text }}>
            <Text style={styles.usernameText}>{post.author.username} </Text>
            <Text style={styles.captionText}>{post.caption}</Text>
          </Text>
        </View>
      )}

      {/* Comments Count */}
      {post.commentsCount > 0 && (
        <TouchableOpacity onPress={handlePostPress}>
          <Text style={[styles.commentsText, { color: theme.colors.textSecondary }]}>
            View all {post.commentsCount} comments
          </Text>
        </TouchableOpacity>
      )}

      {/* Timestamp */}
      <Text style={[styles.timestamp, { color: theme.colors.textSecondary }]}>
        {formatDate(post.createdAt)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  username: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  media: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
  },
  captionContainer: {
    paddingHorizontal: 12,
    marginTop: 8,
  },
  usernameText: {
    fontWeight: '600',
  },
  captionText: {
    lineHeight: 18,
  },
  commentsText: {
    paddingHorizontal: 12,
    marginTop: 4,
    fontSize: 13,
  },
  timestamp: {
    paddingHorizontal: 12,
    marginTop: 4,
    fontSize: 10,
  },
});

