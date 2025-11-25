import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  StatusBar,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import { messageRequestAPI } from '../../services/message-request.service';
import { InboxItem } from '../../types/message';
import { Avatar } from '../../components/common/Avatar';
import { showAlert } from '../../utils/helpers';
import { formatMessageTime } from '../../utils/messageUtils';

export default function PendingMessagesScreen() {
  const { theme } = useTheme();
  const { user: currentUser } = useAuth();
  const router = useRouter();

  const {
    data: inboxItems,
    isLoading,
    refresh,
  } = useInfiniteScroll<InboxItem>({
    fetchFunc: messageRequestAPI.getPendingInboxItems,
    limit: 20,
    onError: error => showAlert('Lỗi', error.message),
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleItemPress = (item: InboxItem) => {
    if (!currentUser || item.type !== 'MESSAGE_REQUEST' || !item.messageRequest) {
      return;
    }

    const mr = item.messageRequest;
    const selfId = currentUser.id;

    // Get the other user (not the current user)
    // In PendingMessagesScreen, currentUser is receiver, other is sender
    const other = mr.sender?.id === selfId ? mr.receiver : mr.sender;

    if (!other || !mr.sender?.id || !mr.receiver?.id) {
      showAlert('Lỗi', 'Không thể xác định người nhận');
      return;
    }

    router.push({
      pathname: '/messages/[conversationId]',
      params: {
        conversationId: other.id, // peerId
        isNewConversation: 'true',
        requestId: mr.id, // để log/telemetry
        direction: 'received', // currentUser is receiver
        senderId: mr.sender.id, // BE-safe
        receiverId: mr.receiver.id, // BE-safe
      },
    });
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
        Tin nhắn đang chờ
      </Text>
      <View style={styles.placeholder} />
    </View>
  );

  const renderInboxItem = ({ item }: { item: InboxItem }) => {
    if (!currentUser) return null;

    // Only handle MESSAGE_REQUEST type (received requests)
    if (item.type === 'MESSAGE_REQUEST' && item.messageRequest) {
      const mr = item.messageRequest;
      const selfId = currentUser.id;

      // Get the other user (not the current user)
      const other = mr.sender?.id === selfId ? mr.receiver : mr.sender;

      if (!other) {
        return null;
      }

      const name = other.username || 'Unknown';
      const avatar = other.avatar;
      const lastMessageContent = mr.lastMessageContent || 'Gửi yêu cầu nhắn tin';
      const timestamp = mr.lastMessageTimestamp || mr.createdAt;

      // Prefix "You: " if current user is the sender
      const displayText = mr.sender?.id === selfId
        ? `You: ${lastMessageContent}`
        : lastMessageContent;

      return (
        <TouchableOpacity
          style={styles.messageItem}
          onPress={() => handleItemPress(item)}
        >
          <Avatar uri={avatar} name={name} size={50} />
          <View style={styles.messageContent}>
            <View style={styles.messageHeader}>
              <View style={styles.messageHeaderLeft}>
                <Text
                  style={[
                    styles.messageUsername,
                    {
                      color: theme.colors.text,
                      fontWeight: '600',
                    },
                  ]}
                >
                  {name}
                </Text>
                <View style={styles.pendingRequestBadge}>
                  <Text style={styles.pendingRequestBadgeText}>Pending</Text>
                </View>
              </View>
              <Text style={[styles.messageTime, { color: theme.colors.textSecondary }]}>
                {formatMessageTime(timestamp)}
              </Text>
            </View>
            <Text
              style={[
                styles.messageText,
                {
                  fontWeight: '400',
                  color: theme.colors.textSecondary,
                  fontStyle: mr.sender?.id === selfId ? 'italic' : 'normal',
                },
              ]}
              numberOfLines={1}
            >
              {displayText}
            </Text>
          </View>
        </TouchableOpacity>
      );
    }

    return null;
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
        <Ionicons
          name="mail-open-outline"
          size={64}
          color={theme.colors.textSecondary}
        />
        <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
          Không có tin nhắn đang chờ
        </Text>
        <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
          Tin nhắn từ người không theo dõi bạn sẽ xuất hiện ở đây
        </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {renderHeader()}

        <FlatList<InboxItem>
          data={inboxItems || []}
          renderItem={renderInboxItem}
          keyExtractor={item =>
            item.type === 'MESSAGE_REQUEST'
              ? item.messageRequest?.id || ''
              : ''
          }
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={!isLoading ? renderEmptyState : null}
          showsVerticalScrollIndicator={false}
        />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 32,
  },
  listContent: {
    flexGrow: 1,
  },
  messageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  messageContent: {
    flex: 1,
    marginLeft: 12,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  messageHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  messageUsername: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 4,
  },
  pendingRequestBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
    backgroundColor: '#FFA500',
  },
  pendingRequestBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  messageTime: {
    fontSize: 12,
    fontWeight: '400',
  },
  messageText: {
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
