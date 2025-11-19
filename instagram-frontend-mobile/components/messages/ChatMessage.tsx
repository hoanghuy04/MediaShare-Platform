import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Message } from '@types';
import { useTheme } from '@hooks/useTheme';
import { formatTime } from '@utils/formatters';

interface ChatMessageProps {
  message: Message;
  isOwn: boolean;
  showStatus?: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, isOwn, showStatus = true }) => {
  const { theme } = useTheme();

  const getStatusIcon = () => {
    if (!isOwn || !showStatus) return null;
    
    if (message.isRead) {
      return <Ionicons name="checkmark-done" size={12} color="rgba(255,255,255,0.7)" />;
    } else {
      return <Ionicons name="checkmark" size={12} color="rgba(255,255,255,0.7)" />;
    }
  };

  return (
    <View style={[styles.container, isOwn ? styles.ownMessage : styles.otherMessage]}>
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: isOwn ? theme.colors.primary : theme.colors.surface,
          },
        ]}
      >
        <Text style={[styles.content, { color: isOwn ? '#fff' : theme.colors.text }]}>
          {message.content}
        </Text>
        <View style={styles.footer}>
          <Text
            style={[
              styles.timestamp,
              { color: isOwn ? 'rgba(255,255,255,0.7)' : theme.colors.textSecondary },
            ]}
          >
            {formatTime(message.createdAt)}
          </Text>
          {getStatusIcon()}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  ownMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  content: {
    fontSize: 16,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  timestamp: {
    fontSize: 10,
    marginRight: 4,
  },
});

