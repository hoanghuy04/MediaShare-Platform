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
import { MessageType } from '../../types/enum.type';
import { useTheme } from '../../hooks/useTheme';

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
  return `rgba(${r},${g},${b},${alpha})`;
};

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
    borderTopLeftRadius: isOwn ? 18 : isClusterStart ? 22 : isClusterMiddle ? 16 : 12,
    borderTopRightRadius: isOwn ? (isClusterStart ? 22 : isClusterMiddle ? 16 : 12) : 18,
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
        soundRef.current.unloadAsync().catch(() => {});
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
                  backgroundColor: isOwn ? theme.colors.white : theme.colors.primary,
                },
              ]}
            />
          </View>
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
        </View>
      </View>
    );
  };

  const renderBody = () => {
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
      <Text
        style={[
          styles.content,
          { color: isOwn ? colors.bubbleTextOut : colors.bubbleTextIn },
        ]}
      >
        {message.content}
      </Text>
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
          <Image
            source={avatarUrl ? { uri: avatarUrl } : undefined}
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
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 50,
  },
  bubbleShadow: {
    // Shadow iOS
    shadowColor: '#000',
    shadowOpacity: 0.8,
    shadowRadius: 6,
    shadowOffset: { width: 2, height: 6 },

    // Shadow Android
    elevation: 2,
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
    //image cover
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
  audioWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
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
    backgroundColor: 'rgba(255,255,255,0.3)',
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
});

export default ChatMessage;
