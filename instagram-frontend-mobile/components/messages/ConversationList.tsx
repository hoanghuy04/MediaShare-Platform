import React from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Conversation } from '@types';
import { useTheme } from '@hooks/useTheme';
import { Avatar } from '../common/Avatar';
import { formatDate } from '@utils/formatters';

interface ConversationListProps {
  conversations: Conversation[];
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations = [],
  onRefresh,
  isRefreshing,
}) => {
  const { theme } = useTheme();
  const router = useRouter();

  const renderConversation = ({ item }: { item: Conversation }) => {
    const otherParticipant = item.participants?.[0]; // Simplified for demo
    const hasUnread = (item.unreadCount || 0) > 0;

    if (!otherParticipant) return null;

    return (
      <TouchableOpacity
        style={[styles.conversationItem, { backgroundColor: theme.colors.background }]}
        onPress={() => router.push(`/messages/${item.id}`)}
      >
        <Avatar uri={otherParticipant.profile?.avatar} name={otherParticipant.username} size={56} />

        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text
              style={[
                styles.username,
                { color: theme.colors.text, fontWeight: hasUnread ? '600' : '400' },
              ]}
            >
              {otherParticipant.username}
            </Text>
            {item.lastMessage && (
              <Text style={[styles.timestamp, { color: theme.colors.textSecondary }]}>
                {formatDate(item.lastMessage.createdAt)}
              </Text>
            )}
          </View>

          {item.lastMessage && (
            <View style={styles.messagePreview}>
              <Text
                style={[
                  styles.lastMessage,
                  {
                    color: hasUnread ? theme.colors.text : theme.colors.textSecondary,
                    fontWeight: hasUnread ? '500' : '400',
                  },
                ]}
                numberOfLines={1}
              >
                {item.lastMessage.content}
              </Text>
              {hasUnread && (
                <View style={[styles.unreadBadge, { backgroundColor: theme.colors.primary }]}>
                  <Text style={styles.unreadText}>{item.unreadCount}</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      data={conversations}
      renderItem={renderConversation}
      keyExtractor={item => item.id}
      onRefresh={onRefresh}
      refreshing={isRefreshing}
      ItemSeparatorComponent={() => (
        <View style={[styles.separator, { backgroundColor: theme.colors.border }]} />
      )}
    />
  );
};

const styles = StyleSheet.create({
  conversationItem: {
    flexDirection: 'row',
    padding: 16,
  },
  conversationContent: {
    flex: 1,
    marginLeft: 12,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
  },
  timestamp: {
    fontSize: 12,
  },
  messagePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    fontSize: 14,
    flex: 1,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  unreadText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  separator: {
    height: 1,
    marginLeft: 84,
  },
});
