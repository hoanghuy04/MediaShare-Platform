import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Video, ResizeMode } from 'expo-av';
import { Post } from '@types';
import { useTheme } from '@hooks/useTheme';
import { Avatar } from '../common/Avatar';
import { formatDate, formatNumber } from '@utils/formatters';
import { isVideoFormatSupported } from '@utils/videoUtils';
import apiConfig from '@config/apiConfig';
import { PostResponse, PostLikeUserResponse } from '../../types/post.type';
import { PostLikesModal } from './PostLikesModal';
import { postLikeService } from '@/services/post-like.service';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MEDIA_ASPECT_RATIO = 1; // Square aspect ratio (1:1) like Instagram

interface PostCardProps {
  post: PostResponse;
  showFollowButton?: boolean;
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onBookmark?: (postId: string) => void;
  onFollow?: (userId: string) => void;
  disableNavigation?: boolean;
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
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoStatus, setVideoStatus] = useState<any>({});
  const [videoError, setVideoError] = useState(false);
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [firstLiker, setFirstLiker] = useState<PostLikeUserResponse | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const videoRef = useRef<Video>(null);
  const likeButtonScale = useSharedValue(1);

  const scale = useSharedValue(1);
  const baseScale = useSharedValue(1);
  const uiOpacity = useSharedValue(1);

  useEffect(() => {
    if (post.totalLike > 0) {
      loadFirstLiker();
    }
  }, [post.totalLike]);

  const loadFirstLiker = async () => {
    try {
      const response = await postLikeService.getPostLikes(post.id, 0, 1);
      if (response.content.length > 0) {
        setFirstLiker(response.content[0]);
      }
    } catch (error) {
      console.error('Error loading first liker:', error);
    }
  };

  const handleUserPress = () => {
    router.push(`/users/${post.author.id}`);
  };

  const handleMediaPress = async () => {
    if (disableNavigation) return;
    setIsNavigating(true);
    await new Promise(resolve => setTimeout(resolve, 100)); 
    router.push({
      pathname: '/profile/posts',
      params: { userId: post.author.id, postId: post.id },
    });
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

  const handleLike = async () => {
    if (post.likedByCurrentUser) {
      likeButtonScale.value = withSpring(1.4, { damping: 8, stiffness: 600 }, () => {
        likeButtonScale.value = withSpring(0.8, { damping: 8, stiffness: 600 }, () => {
          likeButtonScale.value = withSpring(1, { damping: 8, stiffness: 400 });
        });
      });
    } else {
      likeButtonScale.value = withSpring(1.4, { damping: 8, stiffness: 600 }, () => {
        likeButtonScale.value = withSpring(1, { damping: 8, stiffness: 400 });
      });
    }
    await onLike?.(post.id);
  };

  const likeButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: likeButtonScale.value }],
  }));

  // Pinch gesture for zoom
  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      baseScale.value = scale.value;
    })
    .onUpdate((e) => {
      scale.value = baseScale.value * e.scale;
      // Limit between 1x and 3x
      if (scale.value < 1) scale.value = 1;
      if (scale.value > 3) scale.value = 3;
      // Hide UI when zooming
      uiOpacity.value = scale.value > 1.1 ? 0 : 1;
    })
    .onEnd(() => {
      // Reset to original size with smooth timing animation (no bounce)
      scale.value = withTiming(1, { duration: 200 });
      baseScale.value = 1;
      uiOpacity.value = withTiming(1, { duration: 200 });
    });

  // Animated style
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    zIndex: scale.value > 1.1 ? 9999 : 1,
  }));

  const uiAnimatedStyle = useAnimatedStyle(() => ({
    opacity: uiOpacity.value,
  }));

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

  const isVideo = (media: any) =>
    media?.type === 'video' || media?.type === 'VIDEO' || media?.url?.endsWith('.mp4');

  const renderMedia = (media: any, index: number) => {
    if (isVideo(media)) {
      if (!isVideoFormatSupported(media.url) || videoError) {
        return (
          <View style={styles.mediaContainer}>
            <Image source={{ uri: media.url }} style={styles.media} resizeMode="cover" />
            <View style={styles.videoErrorOverlay}>
              <Ionicons name="play-circle-outline" size={60} color="rgba(255,255,255,0.8)" />
              <Text style={styles.videoErrorText}>
                {media.url.includes('picsum.photos') ? 'Mock Video' : 'Video không thể phát'}
              </Text>
            </View>
          </View>
        );
      }

      let videoUrl = media.url;
      if (videoUrl && (videoUrl.includes('localhost:8080') || videoUrl.includes('127.0.0.1:8080'))) {
        videoUrl = videoUrl.replace(/https?:\/\/localhost:8080/g, apiConfig.apiUrl);
        videoUrl = videoUrl.replace(/https?:\/\/127\.0\.0\.1:8080/g, apiConfig.apiUrl);
      }

      return (
        <View style={styles.mediaContainer}>
          <Video
            ref={videoRef}
            source={{ uri: videoUrl }}
            style={styles.media}
            resizeMode={ResizeMode.COVER}
            shouldPlay={false}
            isLooping={false}
            isMuted={isMuted}
            onPlaybackStatusUpdate={handleVideoStatusUpdate}
            onError={error => {
              console.error('Video load error:', error);
              console.error('Video URL:', videoUrl);
              console.error('Original URL:', media.url);
              setVideoError(true);
            }}
            onLoad={() => {
              console.log('Video loaded successfully:', videoUrl);
              setVideoError(false);
            }}
          />
          {/* Video Play/Pause Overlay */}
          <View style={styles.videoOverlay}>
            <TouchableOpacity style={styles.playButton} onPress={handleVideoPress}>
              <Ionicons name={isVideoPlaying ? 'pause' : 'play'} size={40} color="white" />
            </TouchableOpacity>
          </View>
          {/* Mute Button */}
          <TouchableOpacity
            style={styles.muteButton}
            onPress={() => setIsMuted(!isMuted)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <View style={styles.muteIconContainer}>
              <Ionicons name={isMuted ? 'volume-mute' : 'volume-high'} size={16} color="white" />
            </View>
          </TouchableOpacity>
        </View>
      );
    } else {
      return (
        <View style={{ position: 'relative' }}>
          <GestureDetector gesture={pinchGesture}>
            <Animated.Image
              source={{ uri: media.url }}
              style={[
                styles.media,
                animatedStyle,
              ]}
              resizeMode="cover"
              onError={error => {
                console.error('Image load error:', error.nativeEvent.error);
                setImageLoadError(true);
              }}
              onLoad={() => {
                setImageLoadError(false);
              }}
            />
          </GestureDetector>
        </View>
      );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Animated.View style={[styles.header, uiAnimatedStyle]}>
        <View style={styles.userInfo}>
          <TouchableOpacity onPress={handleUserPress} style={styles.userInfoLeft}>
            <Avatar uri={post.author.profile?.avatar} name={post.author.username} size={32} />
            <Text style={[styles.username, { color: theme.colors.text }]}>
              {post.author.username}
            </Text>
          </TouchableOpacity>
          {showFollowButton && (
            <TouchableOpacity onPress={() => onFollow?.(post.author.id)}>
              <Text style={[styles.followText, { color: theme.colors.primary }]}>• Theo dõi</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="ellipsis-vertical" size={20} color={theme.colors.text} />
        </TouchableOpacity>
      </Animated.View>

      {/* Media */}
      {post.media && post.media.length > 0 && (
        <TouchableOpacity 
          activeOpacity={0.95} 
          onPress={handleMediaPress}
          disabled={disableNavigation}
        >
          <View style={styles.mediaContainer}>
            {post.media.length === 1 ? (
              // Single media
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
                    <View
                      key={index}
                      style={styles.carouselItem}
                    >
                      {renderMedia(media, index)}
                    </View>
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
            {/* Loading overlay */}
            {isNavigating && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#fff" />
              </View>
            )}
          </View>
        </TouchableOpacity>
      )}

      {/* Actions Row */}
      <Animated.View style={[styles.actionsRow, uiAnimatedStyle]}>
        <View style={styles.leftActions}>
          <TouchableOpacity
            onPress={handleLike}
            style={styles.actionButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Animated.View style={likeButtonAnimatedStyle}>
              <Ionicons
                name={post.likedByCurrentUser ? 'heart' : 'heart-outline'}
                size={28}
                color={post.likedByCurrentUser ? theme.colors.like : theme.colors.text}
              />
            </Animated.View>
            <Text style={[styles.actionCount, { color: theme.colors.text }]}>
              {formatNumber(post.totalLike)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onComment?.(post.id)}
            style={styles.actionButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chatbubble-outline" size={26} color={theme.colors.text} />
            <Text style={[styles.actionCount, { color: theme.colors.text }]}>
              {formatNumber(post.totalComment || 0)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onShare?.(post.id)}
            style={styles.actionButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="paper-plane-outline" size={26} color={theme.colors.text} />
            <Text style={[styles.actionCount, { color: theme.colors.text }]}>
              {formatNumber((post as any).totalShare || 0)}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => onBookmark?.(post.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <View style={styles.bookmarkContainer}>
            <Ionicons
              name={(post as any).isSaved ? 'bookmark' : 'bookmark-outline'}
              size={26}
              color={theme.colors.text}
            />
            {((post as any).bookmarksCount || 0) > 0 && (
              <Text style={[styles.actionCount, { color: theme.colors.text }]}>
                {formatNumber((post as any).bookmarksCount || 0)}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Likes Info */}
      {post.totalLike > 0 && (
        <Animated.View style={uiAnimatedStyle}>
        <TouchableOpacity 
          style={styles.likesInfo}
          onPress={() => setShowLikesModal(true)}
          activeOpacity={0.7}
        >
          <Text style={[styles.likesText, { color: theme.colors.text }]}>
            {firstLiker ? (
              <>
                <Text style={styles.boldText}>{firstLiker.username}</Text>
                {post.totalLike > 1 && (
                  <Text> và {formatNumber(post.totalLike - 1)} người khác đã thích</Text>
                )}
              </>
            ) : (
              <Text style={styles.boldText}>{formatNumber(post.totalLike)} lượt thích</Text>
            )}
          </Text>
        </TouchableOpacity>
        </Animated.View>
      )}

      {/* Caption */}
      {post.caption && (
        <Animated.View style={[styles.captionContainer, uiAnimatedStyle]}>
          <Text style={{ color: theme.colors.text }} numberOfLines={2}>
            <Text style={styles.usernameText}>{post.author.username} </Text>
            <Text style={styles.captionText}>{post.caption}</Text>
          </Text>
        </Animated.View>
      )}

      {/* Timestamp */}
      <Animated.View style={[styles.timestampRow, uiAnimatedStyle]}>
        <Text style={[styles.timestamp, { color: theme.colors.textSecondary }]}>
          {formatDate(post.createdAt)}
        </Text>
        <Text style={[styles.dot, { color: theme.colors.textSecondary }]}> • </Text>
        <TouchableOpacity>
          <Text style={[styles.translation, { color: theme.colors.textSecondary }]}>
            Xem bản dịch
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Likes Modal */}
      <PostLikesModal
        visible={showLikesModal}
        postId={post.id}
        onClose={() => setShowLikesModal(false)}
      />
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
    gap: 8,
  },
  userInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  likesInfo: {
    paddingHorizontal: 12,
    marginTop: 8,
    marginBottom: 4,
  },
  likesText: {
    fontSize: 14,
  },
  boldText: {
    fontWeight: '600',
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
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
});
