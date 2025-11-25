// components/messages/ChatMessage.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { useRouter } from 'expo-router';
import { Message, MessageRef } from '../../types/message';
import { MessageType, PostType, MediaCategory } from '../../types/enum.type';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { useTheme } from '../../hooks/useTheme';
import { LinkableText } from './LinkableText';
import { Avatar } from '../common/Avatar';

type BubblePalette = {
  bubbleIn: string;
  bubbleOut: string;
  bubbleTextIn: string;
  bubbleTextOut: string;
};

interface ChatMessageProps {
  message: Message;
  isOwn: boolean;
  isClusterStart?: boolean;
  isClusterMiddle?: boolean;
  isClusterEnd?: boolean;
  showAvatar?: boolean;
  avatarUrl?: string;
  replyTo?: MessageRef;
  onPressReply?: (messageId: string) => void;
  palette?: BubblePalette;
  showAvatarAtClusterEnd?: boolean;
}

// helper convert hex trong theme -> rgba
const hexToRgba = (hex: string, alpha: number) => {
  const cleaned = hex.replace('#', '');
  if (cleaned.length !== 6) return hex;
  const num = parseInt(cleaned, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r},${g},${b},alpha)`.replace('alpha', String(alpha));
};

/* -------- POST SHARE UI -------- */
const PostShareBubble = ({ message }: { message: Message }) => {
  const { theme } = useTheme();
  const router = useRouter();
  const [generatedThumbnail, setGeneratedThumbnail] = useState<string | null>(null);

  const post = message.postResponse;

  const handlePress = () => {
    if (!post) return;
    router.push({
      pathname: '/profile/reels',
      params: { userId: post.author?.id, postId: post.id }
    });
  };

  if (!post) {
    return (
      <View style={[styles.postShareContainer, { backgroundColor: theme.colors.card, padding: 12, justifyContent: 'center', alignItems: 'center' }]}>
        <Ionicons name="alert-circle-outline" size={24} color={theme.colors.textSecondary} />
        <Text style={{ color: theme.colors.textSecondary, fontSize: 12, marginTop: 4 }}>
          Bài viết không tồn tại
        </Text>
      </View>
    );
  }

  const isReel = post.type === PostType.REEL;
  const videoMedia = post.media?.find(m => m.category === MediaCategory.VIDEO);
  const imageMedia = post.media?.find(m => m.category === MediaCategory.IMAGE);

  useEffect(() => {
    let mounted = true;
    if (isReel && videoMedia && !imageMedia && !generatedThumbnail) {
      VideoThumbnails.getThumbnailAsync(videoMedia.url, { time: 0 })
        .then(({ uri }) => {
          if (mounted) setGeneratedThumbnail(uri);
        })
        .catch(e => console.log('Thumbnail error', e));
    }
    return () => { mounted = false; };
  }, [isReel, videoMedia, imageMedia]);

  const displayUrl = generatedThumbnail || imageMedia?.url || videoMedia?.url || post.media?.[0]?.url;
  const isMultiple = (post.media?.length || 0) > 1;

  // REEL LAYOUT
  if (isReel) {
    return (
      <TouchableOpacity
        style={[styles.postShareContainer, { width: 180 }]}
        activeOpacity={0.9}
        onPress={handlePress}
      >
        <View style={styles.postShareHeader}>
          <Avatar
            uri={post.author?.profile?.avatar}
            name={post.author?.username}
            size={24}
            style={{ marginRight: 8 }}
          />
          <Text style={[styles.postShareUsername, { color: theme.colors.text }]} numberOfLines={1}>
            {post.author?.username}
          </Text>
        </View>

        <View style={styles.reelImageWrapper}>
          {displayUrl ? (
            <Image source={{ uri: displayUrl }} style={styles.postShareImage} resizeMode="cover" />
          ) : (
            <View style={[styles.postShareImage, { backgroundColor: '#eee' }]} />
          )}

          {/* Video Indicator (Top Right) */}
          <View style={styles.videoIndicator}>
            <Ionicons name="play" size={16} color="white" />
          </View>

          {/* View Count Overlay (Bottom Left) */}
          <View style={styles.viewCountOverlay}>
            <Ionicons name="play" size={12} color="white" />
            <Text style={styles.viewCountText}>{post.totalLike || 0}</Text>
          </View>
        </View>

        {post.caption ? (
          <Text style={[styles.postShareCaption, { color: theme.colors.text }]} numberOfLines={2}>
            <Text style={{ fontWeight: '600' }}>{post.author?.username}</Text> {post.caption}
          </Text>
        ) : null}
      </TouchableOpacity>
    );
  }

  // FEED LAYOUT (Default)
  return (
    <TouchableOpacity
      style={[styles.postShareContainer, { backgroundColor: theme.colors.card }]}
      activeOpacity={0.9}
      onPress={handlePress}
    >
      <View style={styles.postShareHeader}>
        <Avatar
          uri={post.author?.profile?.avatar}
          name={post.author?.username}
          size={24}
          style={{ marginRight: 8 }}
        />
        <Text style={[styles.postShareUsername, { color: theme.colors.text }]} numberOfLines={1}>
          {post.author?.username}
        </Text>
      </View>

      <View style={styles.postShareImageWrapper}>
        {displayUrl ? (
          <Image source={{ uri: displayUrl }} style={styles.postShareImage} resizeMode="cover" />
        ) : (
          <View style={[styles.postShareImage, { backgroundColor: '#eee' }]} />
        )}

        {/* Multiple Icon */}
        {isMultiple && (
          <View style={styles.multipleIcon}>
            <Ionicons name="copy-outline" size={18} color="white" />
          </View>
        )}
      </View>

      {post.caption ? (
        <Text style={[styles.postShareCaption, { color: theme.colors.text }]} numberOfLines={2}>
          <Text style={{ fontWeight: '600' }}>{post.author?.username}</Text> {post.caption}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
};

// waveform “fake” – chỉ để hiển thị giống UI Telegram
const WAVE_BARS = [0.35, 0.6, 0.9, 0.5, 0.8, 0.4, 0.7, 1, 0.65, 0.45, 0.8, 0.55, 0.9, 0.6, 0.7];

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isOwn,
  isClusterStart = true,
  isClusterMiddle = false,
  isClusterEnd = true,
  showAvatar = false,
  avatarUrl,
  replyTo,
  onPressReply,
  palette,
  showAvatarAtClusterEnd = true,
}) => {
  const { theme } = useTheme();
  const router = useRouter();
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const [audioPosition, setAudioPosition] = useState(0);
  const [isAudioLoading, setIsAudioLoading] = useState(false);

  const colors: BubblePalette = palette || {
    bubbleIn: theme.chat.bubbleIn,
    bubbleOut: theme.chat.bubbleOut,
    bubbleTextIn: theme.chat.bubbleTextIn,
    bubbleTextOut: theme.chat.bubbleTextOut,
  };

  const gradientColors = useMemo(
    () =>
      [
        theme.chat.gradientHigh,
        theme.chat.gradientMedium,
        theme.chat.gradientLow,
      ] as const,
    [theme.chat.gradientHigh, theme.chat.gradientMedium, theme.chat.gradientLow]
  );

  const containerStyle = [
    styles.row,
    isClusterStart ? styles.clusterGap : styles.clusterTight,
    isOwn ? styles.alignEnd : styles.alignStart,
  ];

  const bubbleShape = {
    borderTopLeftRadius: isOwn ? 18 : isClusterStart ? 22 : 16,
    borderTopRightRadius: isOwn ? (isClusterStart ? 22 : 16) : 18,
    borderBottomLeftRadius: isOwn ? (isClusterEnd ? 22 : 14) : 22,
    borderBottomRightRadius: isOwn ? 22 : (isClusterEnd ? 22 : 14),
  };

  const renderReplyPreview = () => {
    if (!replyTo) return null;
    return (
      <TouchableOpacity
        style={[
          styles.replyPreview,
          {
            backgroundColor: isOwn
              ? hexToRgba(theme.colors.white, 0.18)
              : hexToRgba(theme.colors.black, 0.05),
          },
        ]}
        activeOpacity={0.7}
        onPress={() => replyTo.id && onPressReply?.(replyTo.id)}
      >
        <View
          style={[
            styles.replyIndicator,
            { backgroundColor: isOwn ? theme.colors.white : theme.colors.primary },
          ]}
        />
        <View style={styles.replyTexts}>
          <Text
            style={[
              styles.replyAuthor,
              { color: isOwn ? theme.colors.white : theme.colors.text },
            ]}
            numberOfLines={1}
          >
            {replyTo.sender?.username || 'Trả lời'}
          </Text>
          <Text
            style={[
              styles.replyContent,
              {
                color: isOwn
                  ? hexToRgba(theme.colors.white, 0.85)
                  : theme.colors.textSecondary,
              },
            ]}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {replyTo.content || 'Đã gửi một tin nhắn'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // For IMAGE/VIDEO, content is already the full URL from backend
  const mediaUrl =
    message.type === MessageType.IMAGE || message.type === MessageType.VIDEO
      ? message.content
      : null;
  const audioUri = message.type === MessageType.AUDIO ? message.content : null;

  const cleanupAudio = useCallback(async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.unloadAsync();
      } catch (error) {
        if (__DEV__) {
          console.warn('Error unloading audio message:', error);
        }
      }
      soundRef.current = null;
    }
    setIsAudioPlaying(false);
    setAudioPosition(0);
  }, []);

  const handleAudioStatusUpdate = useCallback(
    (status: AVPlaybackStatus) => {
      if (!status.isLoaded) {
        if ('error' in status && status.error && __DEV__) {
          console.warn('Playback error:', status.error);
        }
        return;
      }
      setIsAudioPlaying(status.isPlaying);
      setAudioDuration(status.durationMillis ?? null);
      setAudioPosition(status.positionMillis ?? 0);
      if (status.didJustFinish) {
        cleanupAudio();
      }
    },
    [cleanupAudio]
  );

  const toggleAudioPlayback = useCallback(async () => {
    if (!audioUri) return;
    try {
      if (soundRef.current) {
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded) {
          if (status.isPlaying) {
            await soundRef.current.pauseAsync();
          } else {
            await soundRef.current.playAsync();
          }
          return;
        }
        await cleanupAudio();
      }
      setIsAudioLoading(true);
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true }
      );
      soundRef.current = sound;
      sound.setOnPlaybackStatusUpdate(handleAudioStatusUpdate);
    } catch (error) {
      if (__DEV__) {
        console.warn('Error playing audio message:', error);
      }
      cleanupAudio();
    } finally {
      setIsAudioLoading(false);
    }
  }, [audioUri, cleanupAudio, handleAudioStatusUpdate]);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => { });
        soundRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    setAudioDuration(null);
    setAudioPosition(0);
    setIsAudioLoading(false);
    cleanupAudio();
  }, [audioUri, cleanupAudio]);

  const formatDuration = (millis: number | null) => {
    if (millis == null) return '0:00';
    const totalSeconds = Math.max(0, Math.floor(millis / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  const audioProgress = audioDuration ? Math.min(audioPosition / audioDuration, 1) : 0;

  const handleOpenMedia = () => {
    if (!mediaUrl) return;

    router.push({
      pathname: '/messages/media-viewer',
      params: {
        url: mediaUrl,
        type: message.type,
        senderName: message.sender?.username || '',
        avatar: message.sender?.avatar || '',
        createdAt: message.createdAt || '',
      },
    });
  };

  /* -------- AUDIO BODY (UI giống hình gửi) -------- */
  const renderAudioBody = () => {
    if (!audioUri) {
      return (
        <Text
          style={[
            styles.content,
            { color: isOwn ? colors.bubbleTextOut : colors.bubbleTextIn },
          ]}
        >
          Tin nhắn thoại
        </Text>
      );
    }

    const buttonBg = isOwn
      ? hexToRgba(theme.colors.white, 0.85)
      : hexToRgba('#000000', 0.25);
    const iconColor = isOwn ? theme.colors.primary : theme.colors.white;

    return (
      <View style={styles.audioWrapper}>
        <TouchableOpacity
          style={[styles.audioButton, { backgroundColor: buttonBg }]}
          onPress={toggleAudioPlayback}
          activeOpacity={0.8}
        >
          {isAudioLoading ? (
            <ActivityIndicator size="small" color={iconColor} />
          ) : (
            <Ionicons
              name={isAudioPlaying ? 'pause' : 'play'}
              size={18}
              color={iconColor}
            />
          )}
        </TouchableOpacity>

        <View style={styles.audioMeta}>
          <Text
            style={[
              styles.audioDuration,
              { color: isOwn ? colors.bubbleTextOut : colors.bubbleTextIn },
            ]}
          >
            {formatDuration(
              isAudioPlaying ? audioPosition : audioDuration ?? audioPosition
            )}
          </Text>
          <View
            style={[
              styles.audioProgressTrack,
              {
                backgroundColor: isOwn
                  ? hexToRgba(theme.colors.white, 0.35)
                  : hexToRgba('#000000', 0.1),
              },
            ]}
          >
            <View
              style={[
                styles.audioProgressBar,
                {
                  width: `${Math.min(audioProgress * 100, 100)}%`,
                  backgroundColor: isOwn
                    ? theme.colors.white
                    : theme.colors.primary,
                },
              ]}
            />
          </View>

        </View>
      </View>
    );
  };


  const renderBody = () => {
    // POST SHARE
    if (message.type === MessageType.POST_SHARE) {
      return <PostShareBubble message={message} />;
    }

    // IMAGE
    if (message.type === MessageType.IMAGE) {
      return (
        <TouchableOpacity
          style={styles.mediaContainer}
          activeOpacity={0.9}
          onPress={handleOpenMedia}
        >
          {mediaUrl ? (
            <Image
              source={{ uri: mediaUrl }}
              style={styles.imageMedia}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.imageMedia, styles.mediaPlaceholder]}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
            </View>
          )}
        </TouchableOpacity>
      );
    }

    // VIDEO
    if (message.type === MessageType.VIDEO) {
      return (
        <TouchableOpacity
          style={styles.mediaContainer}
          onPress={handleOpenMedia}
          activeOpacity={0.9}
        >
          {mediaUrl ? (
            <View style={styles.videoContainer}>
              <Image
                source={{ uri: mediaUrl }}
                style={styles.videoThumbnail}
                resizeMode="cover"
              />
              <View style={styles.playIconOverlay}>
                <View
                  style={[
                    styles.playIconCircle,
                    { backgroundColor: 'rgba(0,0,0,0.6)' },
                  ]}
                >
                  <Ionicons name="play" size={32} color="#fff" />
                </View>
              </View>
            </View>
          ) : (
            <View style={[styles.videoThumbnail, styles.mediaPlaceholder]}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
            </View>
          )}
        </TouchableOpacity>
      );
    }

    if (message.type === MessageType.AUDIO) {
      return renderAudioBody();
    }

    // TEXT
    return (
      <LinkableText
        text={message.content}
        style={[
          styles.content,
          { color: isOwn ? colors.bubbleTextOut : colors.bubbleTextIn },
        ]}
        linkStyle={{
          color: isOwn ? colors.bubbleTextOut : colors.bubbleTextIn,
          fontWeight: '600',
          opacity: 0.9,
        }}
      />
    );
  };

  const bubbleInner = (
    <>
      {renderReplyPreview()}
      {renderBody()}
    </>
  );

  return (
    <View style={containerStyle}>
      {/* Username ở đầu cụm của người khác */}
      {!isOwn && isClusterStart && message.sender?.username && (
        <Text
          style={[
            styles.senderName,
            { color: theme.colors.textSecondary },
          ]}
          numberOfLines={1}
        >
          {message.sender.username}
        </Text>
      )}

      <View style={[styles.bubbleWrapper, isOwn ? styles.wrapperOwn : styles.wrapperOther]}>
        <View
          style={[
            styles.bubbleShadow,
            bubbleShape,
          ]}
        >
          {isOwn ? (
            <LinearGradient
              colors={gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }} // top-left -> bottom-right
              style={[styles.bubbleBase, bubbleShape]}
            >
              {bubbleInner}
            </LinearGradient>
          ) : (
            <View
              style={[
                styles.bubbleBase,
                bubbleShape,
                { backgroundColor: colors.bubbleIn },
              ]}
            >
              {bubbleInner}
            </View>
          )}
        </View>

        {showAvatar && showAvatarAtClusterEnd && !isOwn && (
          <Avatar
            uri={avatarUrl}
            name={message.sender?.username}
            size={30}
            style={styles.avatarTail}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    width: '100%',
    paddingHorizontal: 16,
  },
  alignStart: {
    alignItems: 'flex-start',
  },
  alignEnd: {
    alignItems: 'flex-end',
  },
  clusterGap: {
    marginTop: 10,
  },
  clusterTight: {
    marginTop: 4,
  },

  // label username
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
    marginLeft: 4,
  },

  bubbleWrapper: {
    position: 'relative',
    maxWidth: '82%',
    marginTop: 2,
  },
  wrapperOwn: {
    alignSelf: 'flex-end',
  },
  wrapperOther: {
    alignSelf: 'flex-start',
  },
  bubbleBase: {
    minWidth: 60,
    paddingHorizontal: 0,
    paddingVertical: 0,
    // không alignItems/justifyContent để con (audioWrapper) được kéo full chiều ngang
  },

  bubbleShadow: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },

  content: {
    fontSize: 15,
    lineHeight: 22,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  avatarTail: {
    position: 'absolute',
    left: -34,
    bottom: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  replyPreview: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 8,
    marginBottom: 6,
  },
  replyIndicator: {
    width: 3,
    borderRadius: 2,
    marginRight: 8,
  },
  replyTexts: {
    flex: 1,
  },
  replyAuthor: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  replyContent: {
    fontSize: 12,
    lineHeight: 16,
  },
  sticker: {
    width: 140,
    height: 140,
    marginVertical: 6,
    borderRadius: 12,
  },
  mediaContainer: {
    overflow: 'hidden',
    borderRadius: 12,
  },
  imageMedia: {
    width: 220,
    height: 280,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  videoContainer: {
    position: 'relative',
  },
  videoThumbnail: {
    width: 220,
    height: 280,
    borderRadius: 12,
  },
  playIconOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaPlaceholder: {
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ---- AUDIO UI ---- */
  audioWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    minWidth: 180,
    maxWidth: 260,
  },

  audioButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  audioMeta: {
    flex: 1,
  },

  audioProgressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },

  audioProgressBar: {
    height: '100%',
    borderRadius: 2,
  },

  audioDuration: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
  audioRight: {
    flex: 1,
    justifyContent: 'center',
  },
  waveRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    marginBottom: 4,
  },
  waveBar: {
    width: 4,
    borderRadius: 999,
    marginRight: 3,
  },

  /* ---- POST SHARE UI ---- */
  postShareContainer: {
    width: 220,
    borderRadius: 12,
    overflow: 'hidden',
  },
  postShareHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#EFEFEF',
  },

  postShareUsername: {
    fontSize: 12,
    fontWeight: '600',
  },
  postShareImageWrapper: {
    width: '100%',
    height: 220, // Square
    position: 'relative',
  },
  reelImageWrapper: {
    width: '100%',
    height: 320, // Vertical 9:16 approx
    position: 'relative',
  },
  postShareImage: {
    width: '100%',
    height: '100%',
  },
  postShareCaption: {
    fontSize: 12,
    padding: 8,
    lineHeight: 16,
  },
  multipleIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  videoIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    padding: 4,
  },
  viewCountOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewCountText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});

export default ChatMessage;
