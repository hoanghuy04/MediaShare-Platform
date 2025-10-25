import React, { useState, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Video, ResizeMode } from 'expo-av';
import { Post } from '@types';
import { useTheme } from '@hooks/useTheme';
import { Avatar } from '../common/Avatar';
import { formatDate, formatNumber } from '@utils/formatters';
import { isVideoFormatSupported } from '@utils/videoUtils';

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
  disableNavigation?: boolean; // Add prop to disable navigation
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  showFollowButton = false,
  onLike,
  onComment,
  onShare,
  onBookmark,
  onFollow,
  disableNavigation = false,
}) => {
  const { theme } = useTheme();
  const router = useRouter();
  const [isMuted, setIsMuted] = useState(true);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [isLiked, setIsLiked] = useState(post.isLikedByCurrentUser || false);
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoStatus, setVideoStatus] = useState<any>({});
  const [videoError, setVideoError] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const videoRef = useRef<Video>(null);

  const handleUserPress = () => {
    router.push(`/users/${post.author.id}`);
  };

  const handlePostPress = () => {
    if (!disableNavigation) {
      router.push(`/posts/${post.id}`);
    }
  };

  const handleMediaScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    if (index !== currentMediaIndex && index >= 0 && index < (post.media?.length || 0)) {
      setCurrentMediaIndex(index);
    }
  };

  const handleScrollBeginDrag = () => {
    setIsScrolling(true);
  };

  const handleScrollEndDrag = () => {
    setTimeout(() => setIsScrolling(false), 100);
  };

  const handleCarouselPress = () => {
    if (!isScrolling && !disableNavigation) {
      handlePostPress();
    }
  };

  const handleLike = async () => {
    try {
      // Optimistic update
      const newLikedState = !isLiked;
      setIsLiked(newLikedState);
      setLikesCount(prev => newLikedState ? prev + 1 : prev - 1);
      
      // Call API
      await onLike?.(post.id);
    } catch (error) {
      // Revert on error
      setIsLiked(!isLiked);
      setLikesCount(prev => isLiked ? prev + 1 : prev - 1);
      console.error('Error liking post:', error);
    }
  };

  const handleVideoPress = async () => {
    if (isVideoPlaying) {
      await videoRef.current?.pauseAsync();
      setIsVideoPlaying(false);
    } else {
      await videoRef.current?.playAsync();
      setIsVideoPlaying(true);
    }
  };

  const handleVideoStatusUpdate = (status: any) => {
    setVideoStatus(status);
    if (status.didJustFinish) {
      setIsVideoPlaying(false);
    }
  };

  const isVideo = (media: any) => media?.type === 'video' || media?.type === 'VIDEO';

  const renderMedia = (media: any, index: number) => {
    if (isVideo(media)) {
      // Check if video format is supported or if it's a mock URL
      if (!isVideoFormatSupported(media.url) || videoError) {
        // Fallback to image when video format is not supported or fails to load
        return (
          <View style={styles.mediaContainer}>
            <Image
              source={{ uri: media.url }}
              style={styles.media}
              resizeMode="cover"
            />
            <View style={styles.videoErrorOverlay}>
              <Ionicons name="play-circle-outline" size={60} color="rgba(255,255,255,0.8)" />
              <Text style={styles.videoErrorText}>
                {media.url.includes('picsum.photos') ? 'Mock Video' : 'Video không thể phát'}
              </Text>
            </View>
          </View>
        );
      }

      return (
        <View style={styles.mediaContainer}>
          <Video
            ref={videoRef}
            source={{ uri: media.url }}
            style={styles.media}
            resizeMode={ResizeMode.COVER}
            shouldPlay={false}
            isLooping={false}
            isMuted={isMuted}
            onPlaybackStatusUpdate={handleVideoStatusUpdate}
            onError={(error) => {
              console.error('Video load error:', error);
              console.error('Video URL:', media.url);
              setVideoError(true);
            }}
            onLoad={() => {
              console.log('Video loaded successfully:', media.url);
              setVideoError(false);
            }}
          />
          {/* Video Play/Pause Overlay */}
          <View style={styles.videoOverlay}>
            <TouchableOpacity
              style={styles.playButton}
              onPress={handleVideoPress}
            >
              <Ionicons
                name={isVideoPlaying ? 'pause' : 'play'}
                size={40}
                color="white"
              />
            </TouchableOpacity>
          </View>
          {/* Mute Button */}
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
        </View>
      );
    } else {
      return (
        <Image
          source={{ uri: media.url }}
          style={styles.media}
          resizeMode="cover"
          onError={(error) => {
            console.error('Image load error:', error.nativeEvent.error);
            console.error('Image URL:', media.url);
            console.error('Image URL type:', typeof media.url);
            console.error('Image URL starts with http:', media.url?.startsWith('http'));
            setImageLoadError(true);
          }}
          onLoad={() => {
            console.log('Image loaded successfully:', media.url);
            setImageLoadError(false);
          }}
        />
      );
    }
  };

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
            <View style={styles.mediaContainer}>
              {post.media.length === 1 ? (
                // Single media
        <TouchableOpacity onPress={handlePostPress} activeOpacity={0.95}>
                  <View style={styles.singleMediaContainer}>
                    {renderMedia(post.media[0], 0)}
                    {imageLoadError && !isVideo(post.media[0]) && (
                      <View style={styles.imageErrorContainer}>
                        <Ionicons name="image-outline" size={48} color="#999" />
                        <Text style={styles.imageErrorText}>Không thể tải hình ảnh</Text>
                        <Text style={styles.imageErrorUrl}>{post.media[0].url}</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ) : (
                // Multiple media carousel
                <View style={styles.carouselContainer}>
                  <ScrollView
                    ref={scrollViewRef}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onScroll={handleMediaScroll}
                    onScrollBeginDrag={handleScrollBeginDrag}
                    onScrollEndDrag={handleScrollEndDrag}
                    onMomentumScrollEnd={handleScrollEndDrag}
                    scrollEventThrottle={16}
                    style={styles.carouselScroll}
                  >
                    {post.media.map((media, index) => (
              <TouchableOpacity
                        key={index} 
                        onPress={handleCarouselPress} 
                        activeOpacity={0.95}
                        style={styles.carouselItem}
                      >
                        {renderMedia(media, index)}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  
                  {/* Media indicators */}
                  <View style={styles.mediaIndicators}>
                    {post.media.map((_, index) => (
                      <View
                        key={index}
                        style={[
                          styles.indicator,
                          index === currentMediaIndex && styles.activeIndicator,
                        ]}
                      />
                    ))}
                  </View>
                </View>
            )}
          </View>
      )}

      {/* Actions Row */}
      <View style={styles.actionsRow}>
        <View style={styles.leftActions}>
          <TouchableOpacity
            onPress={handleLike}
            style={styles.actionButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={isLiked ? 'heart' : 'heart-outline'}
              size={28}
              color={isLiked ? theme.colors.like : theme.colors.text}
            />
            <Text style={[styles.actionCount, { color: theme.colors.text }]}>
              {formatNumber(likesCount)}
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
  singleMediaContainer: {
    position: 'relative',
  },
  carouselContainer: {
    position: 'relative',
  },
  carouselScroll: {
    height: SCREEN_WIDTH * MEDIA_ASPECT_RATIO,
  },
  carouselItem: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * MEDIA_ASPECT_RATIO,
    position: 'relative',
  },
  media: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * MEDIA_ASPECT_RATIO,
  },
  mediaIndicators: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    gap: 4,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  activeIndicator: {
    backgroundColor: 'white',
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
  imageErrorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  imageErrorText: {
    color: '#999',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
      imageErrorUrl: {
        color: '#ccc',
        fontSize: 10,
        marginTop: 4,
        textAlign: 'center',
      },
      videoOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
      },
      playButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
      },
      videoErrorOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
      },
      videoErrorText: {
        color: 'white',
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
      },
    });
