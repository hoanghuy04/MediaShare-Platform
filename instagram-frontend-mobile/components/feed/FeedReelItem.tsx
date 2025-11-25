import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useRouter } from 'expo-router';
import { PostResponse, PostLikeUserResponse } from '../../types/post.type';
import { UserSummaryResponse } from '../../types/user';
import { FollowButton } from '../common/FollowButton';
import { Avatar } from '../common/Avatar';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { PostLikesModal } from './PostLikesModal';
import { PostCommentsModal } from './PostCommentsModal';
import { ShareModal } from './ShareModal';
import { useAuth } from '../../context/AuthContext';

import { MediaCategory } from '../../types/enum.type';
import { postLikeService } from '../../services/post-like.service';
import { followEventManager } from '../../utils/followEventManager';
import { formatDate } from '../../utils/formatters';

const { width } = Dimensions.get('window');
const MEDIA_HEIGHT = width * (16 / 9);

export const FeedReelItem = ({ post, isVisible, onLike }: { post: PostResponse; isVisible: boolean; onLike?: (postId: string) => void }) => {
  const router = useRouter();
  const { user } = useAuth();
  const [showOverlay, setShowOverlay] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [firstLiker, setFirstLiker] = useState<PostLikeUserResponse | null>(null);
  const [isLiked, setIsLiked] = useState(post.likedByCurrentUser);
  const [totalLike, setTotalLike] = useState(post.totalLike);
  const [isProcessingLike, setIsProcessingLike] = useState(false);
  const likeButtonScale = useSharedValue(1);

  const videoFile = post.media.find(m => m.category === MediaCategory.VIDEO);
  const imageFile = post.media.find(m => m.category === MediaCategory.IMAGE);

  const activeMedia = videoFile || imageFile;
  const isVideo = activeMedia?.category === MediaCategory.VIDEO;
  const mediaUrl = activeMedia?.url || '';

  const player = useVideoPlayer(isVideo ? mediaUrl : '', player => {
    if (isVideo) {
      player.loop = false;
      player.muted = isMuted;
    }
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
    setIsLiked(post.likedByCurrentUser);
    setTotalLike(post.totalLike);
  }, [post.id, post.likedByCurrentUser, post.totalLike]);

  useEffect(() => {
    if (totalLike > 0) {
      loadFirstLiker();
    }
  }, [totalLike]);

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
    router.push({
      pathname: '/(tabs)/reels',
      params: { initialPostId: post.id }
    });
  };

  const handleReplay = () => {
    setShowOverlay(false);
    player.replay();
  };

  const handleVideoPress = () => {
    if (!showOverlay) {
      router.push({
        pathname: '/(tabs)/reels',
        params: { initialPostId: post.id }
      });
    }
  };

  const handleLike = async () => {
    if (isProcessingLike) return;
    setIsProcessingLike(true);

    const prevLiked = isLiked;
    const prevTotal = totalLike;

    // Optimistic update
    const nextLiked = !prevLiked;
    const nextTotal = Math.max(0, nextLiked ? prevTotal + 1 : prevTotal - 1);

    setIsLiked(nextLiked);
    setTotalLike(nextTotal);

    // Animation
    if (nextLiked) {
      likeButtonScale.value = withSpring(1.4, { damping: 8, stiffness: 600 }, () => {
        likeButtonScale.value = withSpring(1, { damping: 8, stiffness: 400 });
      });
    } else {
      likeButtonScale.value = withSpring(1.4, { damping: 8, stiffness: 600 }, () => {
        likeButtonScale.value = withSpring(0.8, { damping: 8, stiffness: 600 }, () => {
          likeButtonScale.value = withSpring(1, { damping: 8, stiffness: 400 });
        });
      });
    }

    try {
      const response = await postLikeService.toggleLikePost(post.id);

      if (response?.liked !== undefined) {
        setIsLiked(response.liked);
        if (response.liked !== nextLiked) {
          setTotalLike(prev => response.liked ? prev + 1 : Math.max(0, prev - 1));
        }
      }

      await onLike?.(post.id);
    } catch (error) {
      console.error('Failed to toggle like:', error);
      setIsLiked(prevLiked);
      setTotalLike(prevTotal);
    } finally {
      setIsProcessingLike(false);
    }
  };

  const likeButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: likeButtonScale.value }],
  }));

  const authorData = post.author as UserSummaryResponse;
  const initiallyFollowing = authorData.followingByCurrentUser || false;
  const avatarUrl = authorData.profile?.avatar;

  const [isFollowing, setIsFollowing] = useState(() => {
    const cached = followEventManager.getStatus(post.author.id);
    return cached !== undefined ? cached : (post.author.followingByCurrentUser || false);
  });

  useEffect(() => {
    const cached = followEventManager.getStatus(post.author.id);
    if (cached !== undefined) {
      setIsFollowing(cached);
    } else {
      setIsFollowing(post.author.followingByCurrentUser || false);
    }
  }, [post.author.followingByCurrentUser, post.author.id]);

  useEffect(() => {
    const unsubscribe = followEventManager.subscribe((userId, status) => {
      if (userId === post.author.id) {
        setIsFollowing(status);
      }
    });
    return unsubscribe;
  }, [post.author.id]);

  const renderCaption = () => {
    const caption = post.caption || '';
    const words = caption.split(/\s+/);
    const isLongCaption = words.length > 30;
    const contentToRender = !isExpanded && isLongCaption ? words.slice(0, 30).join(' ') : caption;

    const styledContent = contentToRender.split(/((?:#|@)\w+)/g).map((part, index) => {
      if (part.startsWith('#') || part.startsWith('@')) {
        return (
          <Text key={index} style={styles.hashtagText}>
            {part}
          </Text>
        );
      }
      return (
        <Text key={index} style={styles.captionText}>
          {part}
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
          <TouchableOpacity onPress={() => router.push({ pathname: '/users/[id]', params: { id: post.author.id } })}>
            <Avatar
              uri={avatarUrl}
              name={post.author.username}
              size={36}
              style={styles.avatar}
            />
          </TouchableOpacity>

          <View style={styles.textContainer}>
            <View style={styles.usernameRow}>
              <TouchableOpacity onPress={() => router.push({ pathname: '/users/[id]', params: { id: post.author.id } })}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={[styles.username, { marginRight: 10 }]}>
                    {post.author.username}
                  </Text>
                </View>
              </TouchableOpacity>

              {!isFollowing && post.author.id !== user?.id && (
                <>

                  <FollowButton
                    userId={authorData.id}
                    initialIsFollowing={false}
                    variant="transparent"
                    size="small"
                    textColor="#fff"
                    followingTextColor="#fff"
                    style={{ borderColor: '#fff' }}
                  />
                </>
              )}
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.headerMenuBtn}>
          <MaterialCommunityIcons name="dots-vertical" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.mediaContainer}>
        {isVideo ? (
          <TouchableOpacity activeOpacity={1} onPress={handleVideoPress} style={{ flex: 1 }}>
            <VideoView
              style={styles.video}
              player={player}
              contentFit="cover"
              nativeControls={false}
            />
          </TouchableOpacity>
        ) : (
          <Image
            source={{ uri: mediaUrl }}
            style={styles.video}
            resizeMode="contain"
          />
        )}

        {isVideo && (
          <TouchableOpacity style={styles.muteBtn} onPress={toggleMute}>
            <Ionicons name={isMuted ? 'volume-mute' : 'volume-high'} size={14} color="#fff" />
          </TouchableOpacity>
        )}

        {isVideo && showOverlay && (
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
                name={isLiked ? 'heart' : 'heart-outline'}
                size={28}
                color={isLiked ? '#ed4956' : '#000'}
              />
            </Animated.View>
            <Text style={styles.actionCount}>{totalLike > 999 ? `${(totalLike / 1000).toFixed(1)}K` : totalLike}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionIcon} onPress={() => setShowCommentsModal(true)}>
            <Ionicons
              name="chatbubble-outline"
              size={26}
              color="#000"
              style={{ transform: [{ scaleX: -1 }] }}
            />
            <Text style={styles.actionCount}>{post.totalComment > 999 ? `${(post.totalComment / 1000).toFixed(1)}K` : post.totalComment}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionIcon} onPress={() => setShowShareModal(true)}>
            <Feather name="send" size={26} color="#000" />
            <Text style={styles.actionCount}>0</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity>
          <Feather name="bookmark" size={28} color="#000" />
        </TouchableOpacity>
      </View>

      <View style={styles.infoSection}>
        {totalLike > 0 && (
          <TouchableOpacity
            onPress={() => setShowLikesModal(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.likesText}>
              {firstLiker ?
                (
                  totalLike === 1 ? (
                    <>
                      <Text style={styles.boldText}>{firstLiker.username}</Text> đã thích
                    </>
                  ) : (
                    <>
                      <Text style={styles.boldText}>{firstLiker.username}</Text> và <Text style={styles.boldText}>{(totalLike - 1).toLocaleString()} người khác</Text> đã thích
                    </>
                  )
                ) : (
                  `${totalLike.toLocaleString()} lượt thích`
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

      <PostCommentsModal
        visible={showCommentsModal}
        postId={post.id}
        postAuthorId={post.author.id}
        onClose={() => setShowCommentsModal(false)}
      />

      <ShareModal
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
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
  avatar: { marginRight: 10 },

  textContainer: {
    justifyContent: 'center',

  },

  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  username: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    marginRight: 20
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
  actionIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionCount: {
    fontSize: 13,
    fontWeight: '500',
    color: '#000',
  },
  infoSection: { paddingHorizontal: 12, paddingBottom: 12 },
  likesText: { fontSize: 13, fontWeight: '400', marginBottom: 4, color: '#000' },
  boldText: { fontWeight: '600' },
  captionContainer: { marginBottom: 4 },
  captionText: { fontSize: 14, color: '#000', lineHeight: 20 },
  hashtagText: { fontSize: 14, color: '#4D5DF7', lineHeight: 20 },
  captionUsername: { fontWeight: '700', color: '#000' },
  moreText: { color: '#8e8e8e', fontWeight: '500' },
  dateText: { fontSize: 12, color: '#8e8e8e', marginTop: 2 },
});
