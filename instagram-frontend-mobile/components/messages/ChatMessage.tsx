// components/messages/ChatMessage.tsx
import React from 'react';
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

  const colors: BubblePalette = palette || {
    bubbleIn: theme.chat.bubbleIn,
    bubbleOut: theme.chat.bubbleOut,
    bubbleTextIn: theme.chat.bubbleTextIn,
    bubbleTextOut: theme.chat.bubbleTextOut,
  };

  const gradientColors = [
    theme.chat.gradientHigh,
    theme.chat.gradientMedium,
    theme.chat.gradientLow,
  ];

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

  if (message.type === MessageType.IMAGE) {
    console.log('>>>>>>>>>>>>>>>>>>>>>>>>>Rendering image message with URL:', message);
  }

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
});

export default ChatMessage;
