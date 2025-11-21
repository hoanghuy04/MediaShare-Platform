import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useRouter } from 'expo-router';
import { PostResponse, PostLikeUserResponse } from '../../types/post.type';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { PostLikesModal } from './PostLikesModal';
import { postLikeService } from '@/services/post-like.service';

const { width } = Dimensions.get('window');
const MEDIA_HEIGHT = width * (16 / 9);

export const FeedReelItem = ({ post, isVisible, onLike }: { post: PostResponse; isVisible: boolean; onLike?: (postId: string) => void }) => {
  const router = useRouter();
  const [showOverlay, setShowOverlay] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [firstLiker, setFirstLiker] = useState<PostLikeUserResponse | null>(null);
  const likeButtonScale = useSharedValue(1);

  const videoSource = post.media && post.media.length > 0 ? post.media[0].url : null;

  const player = useVideoPlayer(videoSource, player => {
    player.loop = false;
    player.muted = isMuted;
  });

  useEffect(() => {
    if (isVisible) {
      setShowOverlay(false);
      player.play();
    } else {
      player.pause();
    }
  }, [isVisible, player]);

  useEffect(() => {
    const subscription = player.addListener('playToEnd', () => {
      setShowOverlay(true);
    });
    return () => subscription.remove();
  }, [player]);

  useEffect(() => {
    if (post.totalLike > 0) {
      loadFirstLiker();
    }
  }, [post.totalLike]);

  const loadFirstLiker = async () => {
    try {
      const response = await postLikeService.getPostLikes(post.id, 0, 1);
      if (response.content && response.content.length > 0) {
        setFirstLiker(response.content[0]);
      }
    } catch (error) {
      console.error('Error loading first liker:', error);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (player) player.muted = !isMuted;
  };

  const handleWatchMore = () => {
    // router.push({ pathname: '/reels/[id]', params: { id: post.id } });
  };

  const handleReplay = () => {
    setShowOverlay(false);
    player.replay();
  };

  const handleLike = async () => {
    if (post.likedByCurrentUser) {
      // Unlike - broken heart animation
      likeButtonScale.value = withSpring(1.4, { damping: 8, stiffness: 600 }, () => {
        likeButtonScale.value = withSpring(0.8, { damping: 8, stiffness: 600 }, () => {
          likeButtonScale.value = withSpring(1, { damping: 8, stiffness: 400 });
        });
      });
    } else {
      // Like - bounce animation (faster)
      likeButtonScale.value = withSpring(1.4, { damping: 8, stiffness: 600 }, () => {
        likeButtonScale.value = withSpring(1, { damping: 8, stiffness: 400 });
      });
    }
    await onLike?.(post.id);
  };

  const likeButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: likeButtonScale.value }],
  }));

  const avatarUrl = post.author.profile?.avatar || 'https://via.placeholder.com/40';

  const renderCaption = () => {
    const caption = post.caption || '';
    const words = caption.split(/\s+/);
    const isLongCaption = words.length > 30;
    const contentToRender = !isExpanded && isLongCaption ? words.slice(0, 30).join(' ') : caption;

    const styledContent = contentToRender.split(' ').map((word, index) => {
      const isHashtag = word.startsWith('#');
      return (
        <Text key={index} style={isHashtag ? styles.hashtagText : styles.captionText}>
          {word}{' '}
        </Text>
      );
    });

    return (
      <Text style={styles.captionText}>
        <Text style={styles.captionUsername}>{post.author.username} </Text>
        {styledContent}
        {!isExpanded && isLongCaption && (
          <Text onPress={() => setIsExpanded(true)} style={styles.moreText}>
            ... xem thêm
          </Text>
        )}
      </Text>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerOverlay}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          </View>

          <View style={styles.textContainer}>
            <View style={styles.usernameRow}>
              <Text style={styles.username} numberOfLines={1}>
                {post.author.username}
              </Text>
              <Text style={styles.dotSeparator}>•</Text>
              <TouchableOpacity>
                <Text style={styles.followText}>Theo dõi</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.audioRow}>
              <Text style={styles.audioText} numberOfLines={1}>
                Gợi ý cho bạn
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.headerMenuBtn}>
          <MaterialCommunityIcons name="dots-vertical" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.mediaContainer}>
        {videoSource ? (
          <VideoView
            style={styles.video}
            player={player}
            contentFit="cover"
            nativeControls={false}
          />
        ) : (
          <View style={[styles.video, styles.noVideoPlaceholder]}>
            <Text style={styles.noVideoText}>Video loading...</Text>
          </View>
        )}

        <TouchableOpacity style={styles.muteBtn} onPress={toggleMute}>
          <Ionicons name={isMuted ? 'volume-mute' : 'volume-high'} size={14} color="#fff" />
        </TouchableOpacity>

        {showOverlay && (
          <View style={styles.centerOverlay}>
            <TouchableOpacity style={styles.watchMorePill} onPress={handleWatchMore}>
              <MaterialCommunityIcons
                name="movie-play"
                size={16}
                color="#000"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.watchMoreText}>Xem thêm thước phim</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleReplay}>
              <Text style={styles.replayText}>Xem lại</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.actionBar}>
        <View style={styles.leftActions}>
          <TouchableOpacity style={styles.actionIcon} onPress={handleLike}>
            <Animated.View style={likeButtonAnimatedStyle}>
              <Ionicons
                name={post.likedByCurrentUser ? 'heart' : 'heart-outline'}
                size={28}
                color={post.likedByCurrentUser ? '#ed4956' : '#000'}
              />
            </Animated.View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionIcon}>
            <Ionicons
              name="chatbubble-outline"
              size={26}
              color="#000"
              style={{ transform: [{ scaleX: -1 }] }}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionIcon}>
            <Feather name="send" size={26} color="#000" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity>
          <Feather name="bookmark" size={28} color="#000" />
        </TouchableOpacity>
      </View>

      <View style={styles.infoSection}>
        {post.totalLike > 0 && (
          <TouchableOpacity 
            onPress={() => setShowLikesModal(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.likesText}>
              {firstLiker ? 
              (
                post.totalLike === 1 ? (
                  <>
                    <Text style={styles.boldText}>{firstLiker.username}</Text> đã thích
                  </>
                ) : (
                  <>
                    <Text style={styles.boldText}>{firstLiker.username}</Text> và <Text style={styles.boldText}>{(post.totalLike - 1).toLocaleString()} người khác</Text> đã thích
                  </>
                )
              ) : (
                `${post.totalLike.toLocaleString()} lượt thích`
              )}
            </Text>
          </TouchableOpacity>
        )}
        <View style={styles.captionContainer}>{renderCaption()}</View>
        <Text style={styles.dateText}>6 ngày trước</Text>
      </View>

      <PostLikesModal
        visible={showLikesModal}
        onClose={() => setShowLikesModal(false)}
        postId={post.id}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    backgroundColor: '#fff',
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 12,
    height: 60,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#fff',
    marginRight: 10,
  },
  avatar: { width: '100%', height: '100%', borderRadius: 18 },

  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },

  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  username: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    maxWidth: '70%',
  },
  dotSeparator: { color: '#fff', marginHorizontal: 5, fontSize: 12 },
  followText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  audioRow: { marginTop: 1 },
  audioText: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.9,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  headerMenuBtn: { padding: 4 },
  mediaContainer: {
    width: width,
    height: MEDIA_HEIGHT,
    backgroundColor: '#000',
    position: 'relative',
    overflow: 'hidden',
  },
  video: { width: '100%', height: '100%' },
  noVideoPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  noVideoText: { color: '#fff' },
  muteBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 6,
    borderRadius: 20,
  },
  centerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 5,
  },
  watchMorePill: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  watchMoreText: { fontWeight: '600', fontSize: 14 },
  replayText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  leftActions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  actionIcon: {},
  infoSection: { paddingHorizontal: 12, paddingBottom: 12 },
  likesText: { fontSize: 13, fontWeight: '400', marginBottom: 4, color: '#000' },
  boldText: { fontWeight: '600' },
  captionContainer: { marginBottom: 4 },
  captionText: { fontSize: 14, color: '#000', lineHeight: 20 },
  hashtagText: { fontSize: 14, color: '#00376b', lineHeight: 20 },
  captionUsername: { fontWeight: '700', color: '#000' },
  moreText: { color: '#8e8e8e', fontWeight: '500' },
  dateText: { fontSize: 12, color: '#8e8e8e', marginTop: 2 },
});
