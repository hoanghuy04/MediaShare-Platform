import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Post } from '@types';
import { useTheme } from '@hooks/useTheme';
import { Avatar } from '../common/Avatar';
import { formatDate, formatNumber } from '@utils/formatters';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MEDIA_ASPECT_RATIO = 9 / 16; // 16:9 aspect ratio

interface PostCardProps {
  post: Post;
  showFollowButton?: boolean;
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onBookmark?: (postId: string) => void;
  onFollow?: (userId: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  showFollowButton = false,
  onLike,
  onComment,
  onShare,
  onBookmark,
  onFollow,
}) => {
  const { theme } = useTheme();
  const router = useRouter();
  const [isMuted, setIsMuted] = useState(true);

  const handleUserPress = () => {
    router.push(`/users/${post.author.id}`);
  };

  const handlePostPress = () => {
    router.push(`/posts/${post.id}`);
  };

  const isVideo = post.media?.[0]?.type === 'video' || post.media?.[0]?.type === 'VIDEO';

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleUserPress} style={styles.userInfo}>
          <Avatar uri={post.author.profile?.avatar} name={post.author.username} size={32} />
          <Text style={[styles.username, { color: theme.colors.text }]}>
            {post.author.username}
          </Text>
          {showFollowButton && (
            <>
              <Text style={[styles.dot, { color: theme.colors.text }]}> • </Text>
              <TouchableOpacity onPress={() => onFollow?.(post.author.id)}>
                <Text style={[styles.followText, { color: theme.colors.primary }]}>Theo dõi</Text>
              </TouchableOpacity>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="ellipsis-vertical" size={20} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      {/* Media */}
      {post.media && post.media.length > 0 && (
        <TouchableOpacity onPress={handlePostPress} activeOpacity={0.95}>
          <View style={styles.mediaContainer}>
            <Image source={{ uri: post.media[0].url }} style={styles.media} resizeMode="cover" />
            {isVideo && (
              <TouchableOpacity
                style={styles.muteButton}
                onPress={() => setIsMuted(!isMuted)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <View style={styles.muteIconContainer}>
                  <Ionicons
                    name={isMuted ? 'volume-mute' : 'volume-high'}
                    size={16}
                    color="white"
                  />
                </View>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      )}

      {/* Actions Row */}
      <View style={styles.actionsRow}>
        <View style={styles.leftActions}>
          <TouchableOpacity
            onPress={() => onLike?.(post.id)}
            style={styles.actionButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={post.isLikedByCurrentUser ? 'heart' : 'heart-outline'}
              size={28}
              color={post.isLikedByCurrentUser ? theme.colors.like : theme.colors.text}
            />
            <Text style={[styles.actionCount, { color: theme.colors.text }]}>
              {formatNumber(post.likesCount || 0)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onComment?.(post.id)}
            style={styles.actionButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chatbubble-outline" size={26} color={theme.colors.text} />
            <Text style={[styles.actionCount, { color: theme.colors.text }]}>
              {formatNumber(post.commentsCount || 0)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onShare?.(post.id)}
            style={styles.actionButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="paper-plane-outline" size={26} color={theme.colors.text} />
            <Text style={[styles.actionCount, { color: theme.colors.text }]}>
              {formatNumber(post.sharesCount || 0)}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => onBookmark?.(post.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <View style={styles.bookmarkContainer}>
            <Ionicons
              name={post.isSaved ? 'bookmark' : 'bookmark-outline'}
              size={26}
              color={theme.colors.text}
            />
            {(post.bookmarksCount || 0) > 0 && (
              <Text style={[styles.actionCount, { color: theme.colors.text }]}>
                {formatNumber(post.bookmarksCount || 0)}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* Caption */}
      {post.caption && (
        <View style={styles.captionContainer}>
          <Text style={{ color: theme.colors.text }} numberOfLines={2}>
            <Text style={styles.usernameText}>{post.author.username} </Text>
            <Text style={styles.captionText}>{post.caption}</Text>
          </Text>
          {post.caption.length > 100 && (
            <TouchableOpacity onPress={handlePostPress}>
              <Text style={[styles.seeMore, { color: theme.colors.textSecondary }]}>xem thêm</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Timestamp */}
      <View style={styles.timestampRow}>
        <Text style={[styles.timestamp, { color: theme.colors.textSecondary }]}>
          {formatDate(post.createdAt)}
        </Text>
        <Text style={[styles.dot, { color: theme.colors.textSecondary }]}> • </Text>
        <TouchableOpacity>
          <Text style={[styles.translation, { color: theme.colors.textSecondary }]}>
            Xem bản dịch
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  username: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  dot: {
    fontSize: 14,
  },
  followText: {
    fontSize: 14,
    fontWeight: '600',
  },
  mediaContainer: {
    position: 'relative',
  },
  media: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * MEDIA_ASPECT_RATIO,
  },
  muteButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
  },
  muteIconContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 16,
    padding: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionCount: {
    fontSize: 13,
    fontWeight: '500',
  },
  bookmarkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  captionContainer: {
    paddingHorizontal: 12,
    paddingTop: 4,
  },
  usernameText: {
    fontWeight: '600',
    fontSize: 14,
  },
  captionText: {
    fontSize: 14,
    lineHeight: 18,
  },
  seeMore: {
    fontSize: 14,
    marginTop: 2,
  },
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 4,
  },
  timestamp: {
    fontSize: 11,
  },
  translation: {
    fontSize: 11,
  },
});
