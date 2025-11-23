import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  StatusBar,
  SafeAreaView,
  Image,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { useWebSocket } from '../../context/WebSocketContext';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import { userAPI } from '../../services/api';
import { messageAPI } from '../../services/message.service';
import { showAlert } from '../../utils/helpers';
import { Avatar } from '../../components/common/Avatar';
import { UserProfile, Conversation, Message, InboxItem, UserSummary } from '../../types';
import {
  getConversationName,
  getConversationAvatar,
  calculateUnreadCount,
  formatMessageTime,
} from '../../utils/messageUtils';
import { messageRequestAPI } from '../../services/api';

export default function MessagesScreen() {
  const { theme } = useTheme();
  const { user: currentUser } = useAuth();
  const { onMessage, onTyping, onReadReceipt } = useWebSocket();
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [conversationMessages, setConversationMessages] = useState<{
    [conversationId: string]: Message[];
  }>({});
  const [typingUsers, setTypingUsers] = useState<{ [conversationId: string]: boolean }>({});
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [followingStrip, setFollowingStrip] = useState<UserSummary[]>([]);
  const [isLoadingFollowing, setIsLoadingFollowing] = useState(false);
  const typingTimeouts = useRef<{ [conversationId: string]: number }>({});
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    data: inboxItems,
    isLoading,
    refresh,
  } = useInfiniteScroll<InboxItem>({
    fetchFunc: messageAPI.getInbox,
    limit: 20,
    onError: error => showAlert('Error', error.message),
  });

  useEffect(() => {
    loadPendingRequestsCount();
  }, [inboxItems]);

  // Debounced refresh to prevent multiple rapid calls
  const debouncedRefresh = React.useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    refreshTimeoutRef.current = setTimeout(() => {
      console.log('Debounced refresh triggered');
      refresh();
    }, 300);
  }, [refresh]);

  // useEffect(() => {
  //   if (!hasInitiallyLoaded.current) {
  //     hasInitiallyLoaded.current = true;
  //     refresh();
  //     loadPendingRequestsCount();
  //   }
  // }, []);

  const loadPendingRequestsCount = async () => {
    try {
      const count = await messageRequestAPI.getPendingRequestsCount();
      setPendingRequestsCount(count);
    } catch (error) {
      console.error('Error loading pending requests count:', error);
    }
  };

  const loadFollowingStrip = React.useCallback(async () => {
    if (!currentUser?.id) {
      return;
    }
    try {
      setIsLoadingFollowing(true);
      const data = await userAPI.getFollowingSummary(currentUser.id, { page: 0, size: 20 });
      setFollowingStrip(data || []);
    } catch (error) {
      console.warn('loadFollowingStrip error', error);
    } finally {
      setIsLoadingFollowing(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    loadFollowingStrip();
  }, [loadFollowingStrip]);

  // Set up WebSocket listener for real-time message updates
  useEffect(() => {
    const handleWebSocketMessage = (message: any) => {
      console.log('Messages screen received WebSocket message:', message);

      if (message.type === 'CHAT' && message.conversationId) {
        // Use debounced refresh to prevent multiple rapid calls
        debouncedRefresh();
      }
    };

    const handleTyping = (isTyping: boolean, conversationId: string) => {
      console.log('Typing indicator:', { isTyping, conversationId });

      if (typingTimeouts.current[conversationId]) {
        clearTimeout(typingTimeouts.current[conversationId]);
        delete typingTimeouts.current[conversationId];
      }

      if (isTyping) {
        setTypingUsers(prev => ({
          ...prev,
          [conversationId]: true,
        }));

        typingTimeouts.current[conversationId] = setTimeout(() => {
          setTypingUsers(prev => ({
            ...prev,
            [conversationId]: false,
          }));
          delete typingTimeouts.current[conversationId];
        }, 3000);
      } else {
        setTypingUsers(prev => ({
          ...prev,
          [conversationId]: false,
        }));
      }
    };

    const handleReadReceipt = (messageId: string, conversationId: string) => {
      console.log('Read receipt:', { messageId, conversationId });
      // Use debounced refresh to prevent multiple rapid calls
      debouncedRefresh();
    };

    onMessage(handleWebSocketMessage);
    onTyping(handleTyping);
    onReadReceipt(handleReadReceipt);

    return () => {
      Object.values(typingTimeouts.current).forEach(timeout => clearTimeout(timeout));
      typingTimeouts.current = {};
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
    };
  }, [onMessage, onTyping, onReadReceipt, debouncedRefresh]);

  // Refresh data when screen comes into focus (debounced)
  useFocusEffect(
    React.useCallback(() => {
      console.log('Messages screen focused, refreshing...');
      debouncedRefresh();
    }, [debouncedRefresh])
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refresh();
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleMessagePress = (conversationId: string) => {
    router.push(`/messages/${conversationId}`);
  };

  const handlePressFollowingUser = async (peerId: string) => {
    const convId = await messageAPI.resolveDirectByPeer(peerId);
    if (convId) {
      router.push({ pathname: '/messages/[conversationId]', params: { conversationId: convId } });
    } else {
      router.push({
        pathname: '/messages/[conversationId]',
        params: { conversationId: peerId, isNewConversation: 'true', direction: 'sent', senderId: currentUser.id, receiverId: peerId },
      });
    }
  };

  const handleLongPress = (conversation: Conversation) => {
    // TODO: Show options (delete, mute, etc.)
    console.log('Long press on conversation:', conversation.id);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
      </TouchableOpacity>
      <View style={styles.headerCenter}>
        <Text style={[styles.username, { color: theme.colors.text }]}>
          {currentUser?.username || 'User'}
        </Text>
        <View style={styles.statusDot} />
        <Ionicons name="chevron-down" size={16} color={theme.colors.text} />
      </View>
      <TouchableOpacity style={styles.editButton}>
        <Ionicons name="create-outline" size={24} color={theme.colors.text} />
      </TouchableOpacity>
    </View>
  );

  const renderSearchBar = () => (
    <TouchableOpacity
      style={styles.searchContainer}
      onPress={() => router.push('/messages/message-search')}
      activeOpacity={0.7}
    >
      <View style={styles.searchBar}>
        <View style={styles.aiIcon}>
          <Ionicons name="sparkles" size={16} color="white" />
        </View>
        <Text style={[styles.searchPlaceholder, { color: theme.colors.textSecondary }]}>
          Hỏi AI hoặc tìm kiếm
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderNotesSection = () => (
    <View style={styles.noteArea}>
      {/* <View style={styles.noteChipRow}>
        <TouchableOpacity
          style={styles.noteChip}
          onPress={() => router.push('/messages/notes')}
          activeOpacity={0.7}
        >
          <Text style={styles.noteChipText}>Ghi chú</Text>
        </TouchableOpacity>
      </View> */}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.followingRow}
      >
        <TouchableOpacity style={styles.followingItem} onPress={() => router.push('/messages/notes')}>
          <Avatar
            uri={currentUser?.profile?.avatar}
            name={currentUser?.username}
            size={70}
            style={styles.followingAvatar}
          />
          <Text
            style={[styles.followingName, { color: theme.colors.textSecondary }]}
            numberOfLines={1}
          >
            Ghi chú của bạn
          </Text>
        </TouchableOpacity>

        {isLoadingFollowing
          ? Array.from({ length: 8 }).map((_, index) => (
            <View key={`skeleton-${index}`} style={styles.followingItem}>
              <View style={styles.followingSkeletonAvatar} />
              <View style={styles.followingSkeletonText} />
            </View>
          ))
          : followingStrip.map(item => (
            <TouchableOpacity
              key={item.id}
              style={styles.followingItem}
              onPress={() => handlePressFollowingUser(item.id)}
              activeOpacity={0.75}
            >
              <Avatar
                uri={item.avatar}
                name={item.username}
                size={70}
                style={styles.followingAvatar}
              />
              <Text
                style={[styles.followingName, { color: theme.colors.textSecondary }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {item.username}
              </Text>
            </TouchableOpacity>
          ))}
      </ScrollView>
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabHeaderContainer}>
      {/* Text "Tin nhắn" bên trái */}
      <Text style={styles.headerTitle}>Tin nhắn </Text>

      {/* Nút "Tin nhắn đang chờ" bên phải */}
      <TouchableOpacity
        style={styles.pendingButton}
        onPress={() => router.push('/messages/pending-messages')}
      >
        <Text style={styles.pendingText}>Tin nhắn đang chờ</Text>
        {pendingRequestsCount > 0 && (
          <View style={styles.pendingBadgeTab}>
            <Text style={styles.pendingBadgeTabText}>
              {pendingRequestsCount > 99 ? '99+' : pendingRequestsCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );

  // Render inbox item (conversation or message request)
  const renderInboxItem = ({ item }: { item: InboxItem }) => {
    console.log('item', item);

    if (!currentUser) return null;

    // Handle conversation type
    if (item.type === 'CONVERSATION' && item.conversation) {
      const conversation = item.conversation;
      
      // Skip group conversations with less than 2 participants
      if (conversation.type === 'GROUP' && (!conversation.participants || conversation.participants.length < 2)) {
        return null;
      }
      const conversationName = getConversationName(conversation, currentUser.id);
      const conversationAvatar = getConversationAvatar(conversation, currentUser.id);
      const lastMessage = conversation.lastMessage;
      const isTyping = typingUsers[conversation.id] || false;

      // Calculate unread count from messages (will be fetched on demand)
      const messages = conversationMessages[conversation.id] || [];
      const unreadCount = calculateUnreadCount(messages, currentUser.id);
      const isUnread = unreadCount > 0;

      // Display text
      let displayText = lastMessage?.content || 'Chưa có tin nhắn';

      if (conversationName === "ai-assistant") {
        displayText = lastMessage?.content || 'Chat với AI Assistant';
      }
      if (isTyping) {
        displayText = 'Đang nhắn tin...';
      }

      return (
        <TouchableOpacity
          style={styles.messageItem}
          onPress={() => handleMessagePress(conversation.id)}
          onLongPress={() => handleLongPress(conversation)}
        >
          <Avatar uri={conversationAvatar} name={conversationName} size={50} />
          <View style={styles.messageContent}>
            <View style={styles.messageHeader}>
              <View style={styles.messageHeaderLeft}>
                <Text
                  style={[
                    styles.messageUsername,
                    {
                      color: theme.colors.text,
                      fontWeight: isUnread ? '700' : '600',
                    },
                  ]}
                >
                  {conversationName}
                </Text>
                {conversation.type === 'GROUP' && (
                  <Ionicons
                    name="people"
                    size={14}
                    color={theme.colors.textSecondary}
                    style={{ marginLeft: 4 }}
                  />
                )}
              </View>
              {lastMessage?.timestamp && (
                <Text style={[styles.messageTime, { color: theme.colors.textSecondary }]}>
                  {formatMessageTime(lastMessage.timestamp)}
                </Text>
              )}
            </View>
            <Text
              style={[
                styles.messageText,
                {
                  fontWeight: isUnread ? '600' : '400',
                  color: isUnread || isTyping ? theme.colors.text : theme.colors.textSecondary,
                  fontStyle: isTyping ? 'italic' : 'normal',
                },
              ]}
              numberOfLines={1}
            >
              {displayText}
            </Text>
          </View>
          {isUnread && !isTyping && (
            <View style={styles.unreadContainer}>
              <View style={[styles.unreadBadge, { backgroundColor: theme.colors.primary }]}>
                <Text style={styles.unreadText}>{unreadCount}</Text>
              </View>
            </View>
          )}
        </TouchableOpacity>
      );
    }

    // Handle message request type
    if (item.type === 'MESSAGE_REQUEST' && item.messageRequest && item.messageRequest.status === 'PENDING') {
      const messageRequest = item.messageRequest;
      // Current user is the sender, show receiver's info
      const receiverName = messageRequest.receiver?.username || 'Unknown';
      const receiverAvatar = messageRequest.receiver?.avatar;
      const lastMessageContent = messageRequest.lastMessageContent || 'Gửi yêu cầu nhắn tin';
      const timestamp = messageRequest.lastMessageTimestamp || messageRequest.createdAt;

      return (
        <TouchableOpacity
          style={styles.messageItem}
          onPress={() => {
            // In MessagesScreen, currentUser is sender, receiver is other
            const currentUserId = currentUser?.id;
            if (!currentUserId || !messageRequest.sender?.id || !messageRequest.receiver?.id) {
              return;
            }
            router.push({
              pathname: '/messages/[conversationId]',
              params: {
                conversationId: messageRequest.receiver.id,
                isNewConversation: 'true',
                requestId: messageRequest.id,
                direction: 'sent', // currentUser is sender
                senderId: messageRequest.sender.id, // BE-safe
                receiverId: messageRequest.receiver.id, // BE-safe
              },
            });
          }}
        >
          <Avatar uri={receiverAvatar} name={receiverName} size={50} />
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
                  {receiverName}
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
                  fontStyle: 'italic',
                },
              ]}
              numberOfLines={1}
            >
              You: {lastMessageContent}
            </Text>
          </View>
        </TouchableOpacity>
      );
    }

    return null;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      <SafeAreaView style={styles.safeArea}>
        {renderHeader()}

        <FlatList<InboxItem>
          data={inboxItems || []}
          renderItem={renderInboxItem}
          keyExtractor={item =>
            item.type === 'CONVERSATION'
              ? item.conversation?.id || ''
              : item.messageRequest?.id || ''
          }
          showsVerticalScrollIndicator={false}
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          contentContainerStyle={styles.flatListContent}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <View>
              {renderSearchBar()}
              {renderNotesSection()}
              {renderTabs()}
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                Chưa có cuộc trò chuyện nào
              </Text>
            </View>
          }
        />
      </SafeAreaView>
    </View>
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
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 8,
    textAlign: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'red',
    marginRight: 4,
  },
  editButton: {
    fontSize: 20,
    fontWeight: 'bold',
    padding: 4,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  aiIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  searchPlaceholder: {
    fontSize: 16,
    flex: 1,
  },
  noteArea: {
    width: '100%',
  },
  noteChipRow: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  noteChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  noteChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  followingRow: {
    paddingLeft: 16,
    paddingRight: 16,
    marginTop: 8,
    paddingBottom: 8,
  },
  followingItem: {
    alignItems: 'center',
    marginRight: 12,
  },
  followingAvatar: {
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  followingName: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 14,
    textAlign: 'center',
    width: '100%',
  },
  followingSkeletonAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E5E5EA',
  },
  followingSkeletonText: {
    width: 42,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F0F0F0',
    marginTop: 6,
  },
  locationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 12,
    marginLeft: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    position: 'relative',
  },
  tabHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  pendingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  pendingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1877F2', // xanh kiểu Facebook Messenger
  },
  pendingBadgeTab: {
    position: 'absolute',
    top: -8,
    right: -12,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  pendingBadgeTabText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#8e8e8e',
  },
  activeTabText: {
    color: '#000',
    fontWeight: '600',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
  },
  flatListContent: {
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
  unreadContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
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
  cameraButton: {
    padding: 8,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
