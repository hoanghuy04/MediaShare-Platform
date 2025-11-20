import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Message, MessageRef } from '../../types/message';
import { useTheme } from '../../hooks/useTheme';

type BubblePalette = {
  bubbleIn: string;
  bubbleOut: string;
  bubbleText: string;
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

  const colors: BubblePalette = palette || {
    bubbleIn: theme.chat.bubbleIn,
    bubbleOut: theme.chat.bubbleOut,
    bubbleText: theme.chat.bubbleText,
  };

  const containerStyle = [
    styles.row,
    isClusterStart ? styles.clusterGap : styles.clusterTight,
    isOwn ? styles.alignEnd : styles.alignStart,
  ];

  const bubbleStyle = [
    styles.bubbleBase,
    {
      backgroundColor: isOwn ? colors.bubbleOut : colors.bubbleIn,
      borderTopLeftRadius: isOwn ? 18 : isClusterStart ? 22 : isClusterMiddle ? 16 : 12,
      borderTopRightRadius: isOwn ? (isClusterStart ? 22 : isClusterMiddle ? 16 : 12) : 18,
      borderBottomLeftRadius: isOwn ? (isClusterEnd ? 22 : 14) : 22,
      borderBottomRightRadius: isOwn ? 22 : (isClusterEnd ? 22 : 14),
    },
  ];

  const renderReplyPreview = () => {
    if (!replyTo) return null;
    return (
      <TouchableOpacity
        style={[
          styles.replyPreview,
          {
            backgroundColor: isOwn ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.05)',
          },
        ]}
        activeOpacity={0.7}
        onPress={() => replyTo.id && onPressReply?.(replyTo.id)}
      >
        <View
          style={[
            styles.replyIndicator,
            { backgroundColor: isOwn ? '#fff' : theme.colors.primary },
          ]}
        />
        <View style={styles.replyTexts}>
          <Text
            style={[
              styles.replyAuthor,
              { color: isOwn ? '#fff' : theme.colors.text },
            ]}
            numberOfLines={1}
          >
            {replyTo.sender?.username || 'Trả lời'}
          </Text>
          <Text
            style={[
              styles.replyContent,
              { color: isOwn ? 'rgba(255,255,255,0.85)' : theme.colors.textSecondary },
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

  const renderBody = () => {
    if (message.type === 'STICKER' && message.mediaUrl) {
      return (
        <Image
          source={{ uri: message.mediaUrl }}
          style={styles.sticker}
          resizeMode="contain"
        />
      );
    }

    return (
      <Text
        style={[
          styles.content,
          {
            color: isOwn ? '#fff' : colors.bubbleText,
          },
        ]}
      >
        {message.content}
      </Text>
    );
  };

  return (
    <View style={containerStyle}>
      <View style={[styles.bubbleWrapper, isOwn ? styles.wrapperOwn : styles.wrapperOther]}>
        <View style={bubbleStyle}>
          {renderReplyPreview()}
          {renderBody()}
        </View>
        {showAvatar && showAvatarAtClusterEnd && !isOwn && (
          <Image source={avatarUrl ? { uri: avatarUrl } : undefined} style={styles.avatarTail} />
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
  bubbleWrapper: {
    position: 'relative',
    maxWidth: '82%',
  },
  wrapperOwn: {
    alignSelf: 'flex-end',
  },
  wrapperOther: {
    alignSelf: 'flex-start',
  },
  bubbleBase: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  content: {
    fontSize: 15,
    lineHeight: 22,
  },
  avatarTail: {
    position: 'absolute',
    left: -34,
    bottom: -2,
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
});

