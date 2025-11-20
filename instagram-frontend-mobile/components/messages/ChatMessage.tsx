import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Message } from '../../types/message';
import { useTheme } from '../../hooks/useTheme';

interface ChatMessageProps {
  message: Message;
  isOwn: boolean;
  isClusterStart?: boolean;
  isClusterEnd?: boolean;
  showAvatar?: boolean;
  avatarUrl?: string;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isOwn,
  isClusterStart = true,
  isClusterEnd = true,
  showAvatar = false,
  avatarUrl,
}) => {
  const { theme } = useTheme();

  const containerStyle = [
    styles.row,
    isClusterStart ? styles.clusterGap : styles.clusterTight,
  ];

  const bubbleStyle = [
    styles.bubble,
    isOwn ? styles.bubbleOwn : styles.bubbleOther,
    !isClusterStart && (isOwn ? styles.bubbleOwnNotStart : styles.bubbleOtherNotStart),
    !isClusterEnd && (isOwn ? styles.bubbleOwnNotEnd : styles.bubbleOtherNotEnd),
  ];

  return (
    <View style={containerStyle}>
      <View
        style={[
          styles.bubbleWrapper,
          isOwn ? styles.wrapperOwn : styles.wrapperOther,
        ]}
      >
        <View style={bubbleStyle}>
          <Text style={[styles.content, isOwn ? styles.textRight : styles.textLeft]}>
            {message.content}
          </Text>
        </View>
        {showAvatar && !isOwn && (
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
    paddingLeft: 36
  },
  clusterGap: {
    marginTop: 10,
  },
  clusterTight: {
    marginTop: 3,
  },
  bubbleWrapper: {
    position: 'relative',
    maxWidth: '78%',
  },
  wrapperOwn: {
    alignSelf: 'flex-end',
  },
  wrapperOther: {
    alignSelf: 'flex-start',
  },
  bubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  bubbleOwn: {
    alignSelf: 'flex-end',
    backgroundColor: '#4F6AF5',
    borderTopRightRadius: 16,
  },
  bubbleOther: {
    alignSelf: 'flex-start',
    backgroundColor: '#F4F5F8',
    borderTopLeftRadius: 16,
  },
  bubbleOwnNotStart: {
    borderTopRightRadius: 8,
    borderTopLeftRadius: 8,
  },
  bubbleOtherNotStart: {
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  bubbleOwnNotEnd: {
    borderBottomRightRadius: 8,
    borderBottomLeftRadius: 8,
  },
  bubbleOtherNotEnd: {
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  content: {
    fontSize: 16,
    lineHeight: 20,
  },
  textLeft: {
    color: '#111827',
  },
  textRight: {
    color: '#fff',
  },
  avatarTail: {
    position: 'absolute',
    left: -36,
    bottom: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
  },
});

