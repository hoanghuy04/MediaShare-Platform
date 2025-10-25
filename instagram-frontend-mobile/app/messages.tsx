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
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { useWebSocket } from '../context/WebSocketContext';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { messageAPI, userAPI } from '../services/api';
import { showAlert } from '../utils/helpers';
import { Avatar } from '../components/common/Avatar';
import { UserProfile, Conversation } from '../types';

export default function MessagesScreen() {
  const { theme } = useTheme();
  const { user: currentUser } = useAuth();
  const { onMessage, onTyping, onReadReceipt } = useWebSocket();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'messages'>('messages');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [followingUsers, setFollowingUsers] = useState<UserProfile[]>([]);
  const [lastMessages, setLastMessages] = useState<{ [userId: string]: string }>({});
  const [lastMessageTimestamps, setLastMessageTimestamps] = useState<{ [userId: string]: string }>(
    {}
  );
  const [unreadMessages, setUnreadMessages] = useState<{ [userId: string]: boolean }>({});
  const [typingUsers, setTypingUsers] = useState<{ [userId: string]: boolean }>({});
  const typingTimeouts = useRef<{ [userId: string]: number }>({});
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    data: conversations,
    isLoading,
    refresh,
  } = useInfiniteScroll({
    fetchFunc: messageAPI.getConversations,
    limit: 20,
    onError: error => showAlert('Error', error.message),
  });

  useEffect(() => {
    loadData();
  }, []);

  // Set up WebSocket listener for real-time message updates
  useEffect(() => {
    const handleWebSocketMessage = (message: any) => {
      console.log('Messages screen received WebSocket message:', message);
      console.log('Current user ID:', currentUser?.id);
      console.log('Message sender ID:', message.senderId);
      console.log('Message receiver ID:', message.receiverId);

      if (message.type === 'CHAT') {
        // Update last message for the conversation
        const senderId = message.senderId;
        const receiverId = message.receiverId;
        const otherUserId = senderId === currentUser?.id ? receiverId : senderId;

        console.log('Updating last message for user:', otherUserId, 'content:', message.content);
        console.log('Is message from current user?', senderId === currentUser?.id);

        setLastMessages(prev => ({
          ...prev,
          [otherUserId]: message.content || '',
        }));

        // Update timestamp for sorting
        setLastMessageTimestamps(prev => ({
          ...prev,
          [otherUserId]: message.timestamp || new Date().toISOString(),
        }));

        // Update unread status - mark as unread if message is from other user
        const isFromOtherUser = senderId !== currentUser?.id;
        setUnreadMessages(prev => ({
          ...prev,
          [otherUserId]: isFromOtherUser,
        }));

        // Force UI update for both sender and receiver
        console.log('Message processed - updating UI for user:', otherUserId);

        // Always refresh conversations to ensure latest data is displayed
        // This ensures that messages sent by current user are immediately visible
        if (senderId === currentUser?.id) {
          console.log('Message sent by current user, refreshing conversations...');
          // Clear existing timeout to avoid multiple refresh calls
          if (refreshTimeoutRef.current) {
            clearTimeout(refreshTimeoutRef.current);
          }
          // Use setTimeout to avoid infinite loop and debounce refresh calls
          refreshTimeoutRef.current = setTimeout(() => {
            try {
              refresh();
            } catch (error) {
              console.log('Refresh error (likely due to infinite loop prevention):', error);
            }
          }, 500);
        }

        // If conversation was deleted and we received a new message, refresh to show restored conversation
        // Backend automatically restores deleted conversations when new messages arrive
        if (isFromOtherUser) {
          // Check if this conversation was previously deleted (not in current conversations list)
          const conversationExists = conversations?.some(
            (conv: any) => conv.conversationId === otherUserId
          );
          if (!conversationExists) {
            console.log(
              'Conversation was deleted and received new message, refreshing to show restored conversation'
            );
            refresh(); // Reload conversations to show the restored conversation
          }
        }
      }
    };

    const handleTyping = (isTyping: boolean, userId: string) => {
      console.log('Messages screen received typing indicator:', { isTyping, userId });

      // Clear existing timeout for this user
      if (typingTimeouts.current[userId]) {
        clearTimeout(typingTimeouts.current[userId]);
        delete typingTimeouts.current[userId];
      }

      if (isTyping) {
        // Set typing indicator
        setTypingUsers(prev => ({
          ...prev,
          [userId]: true,
        }));

        // Auto-clear typing indicator after 3 seconds
        typingTimeouts.current[userId] = setTimeout(() => {
          setTypingUsers(prev => ({
            ...prev,
            [userId]: false,
          }));
          delete typingTimeouts.current[userId];
        }, 3000);
      } else {
        // Clear typing indicator immediately
        setTypingUsers(prev => ({
          ...prev,
          [userId]: false,
        }));
      }
    };

    const handleReadReceipt = (messageId: string, senderId: string) => {
      console.log('Messages screen received read receipt:', { messageId, senderId });
      // Update unread status when message is read
      setUnreadMessages(prev => ({
        ...prev,
        [senderId]: false,
      }));
    };

    onMessage(handleWebSocketMessage);
    onTyping(handleTyping);
    onReadReceipt(handleReadReceipt);

    // Cleanup function
    return () => {
      // Clear all typing timeouts
      Object.values(typingTimeouts.current).forEach(timeout => {
        clearTimeout(timeout);
      });
      typingTimeouts.current = {};

      // Clear refresh timeout
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
    };
  }, [currentUser?.id, onMessage, onTyping, onReadReceipt]);

  // Refresh data when screen comes into focus (e.g., returning from conversation)
  useFocusEffect(
    React.useCallback(() => {
      console.log('Messages screen focused, refreshing data...');
      // Only refresh conversations to get latest data
      // Avoid calling loadLastMessagesForUsers to prevent infinite loop
      setTimeout(() => {
        refresh();
      }, 100);
    }, []) // Remove all dependencies to prevent infinite loop
  );

  const loadData = async () => {
    try {
      await Promise.all([refresh(), loadFollowingUsers(), loadLastMessages()]);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadFollowingUsers = async () => {
    try {
      if (currentUser?.id) {
        const following = await userAPI.getFollowing(currentUser.id, 0, 50);
        setFollowingUsers(following || []);
        // Load last messages after following users are loaded
        if (following && following.length > 0) {
          await loadLastMessagesForUsers(following);
        }
      }
    } catch (error) {
      console.error('Error loading following users:', error);
    }
  };

  const loadLastMessagesForUsers = async (users: UserProfile[]) => {
    try {
      if (!currentUser?.id) return;

      const lastMessagesMap: { [userId: string]: string } = {};
      const lastTimestampsMap: { [userId: string]: string } = {};
      const unreadMap: { [userId: string]: boolean } = {};

      // Load last messages for provided users
      for (const user of users) {
        try {
          const response = await messageAPI.getMessages(user.id, 0, 1);
          if (response.content && response.content.length > 0) {
            const lastMessage = response.content[0];
            lastMessagesMap[user.id] = lastMessage.content;
            lastTimestampsMap[user.id] = lastMessage.createdAt;

            // Check if the last message is from the other user and not read by current user
            const isUnread = lastMessage.sender.id !== currentUser.id && !lastMessage.isRead;
            unreadMap[user.id] = isUnread;
          }
        } catch (error) {
          // No messages with this user, continue
          console.log(`No messages with user ${user.id}`);
        }
      }

      setLastMessages(lastMessagesMap);
      setLastMessageTimestamps(lastTimestampsMap);
      setUnreadMessages(unreadMap);
    } catch (error) {
      console.error('Error loading last messages:', error);
    }
  };

  const loadLastMessages = async () => {
    // This function is kept for compatibility but now calls loadLastMessagesForUsers
    await loadLastMessagesForUsers(followingUsers);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([loadFollowingUsers(), loadLastMessagesForUsers(followingUsers)]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleMessagePress = async (userId: string) => {
    // Mark messages as read when entering conversation
    setUnreadMessages(prev => ({
      ...prev,
      [userId]: false,
    }));

    // Navigate directly to conversation using the other user's ID as conversationId
    // The conversation screen will handle marking messages as read via WebSocket
    router.push(`/messages/${userId}`);
  };

  const handleLongPress = (conversation: UserProfile | Conversation) => {
    // Long press functionality removed - no more pin/delete options
    console.log('Long press on conversation:', conversation);
  };

  const handleFollowUser = async (userId: string) => {
    try {
      await userAPI.followUser(userId);

      // Load the newly followed user
      if (currentUser?.id) {
        const updatedFollowing = await userAPI.getFollowing(currentUser.id, 0, 50);
        setFollowingUsers(updatedFollowing || []);

        // Load last messages for the updated following list
        if (updatedFollowing && updatedFollowing.length > 0) {
          await loadLastMessagesForUsers(updatedFollowing);
        }
      }
    } catch (error) {
      console.error('Error following user:', error);
      showAlert('Error', 'Không thể theo dõi người dùng');
    }
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
    <View style={styles.searchContainer}>
      <View style={styles.searchBar}>
        <View style={styles.aiIcon}>
          <Ionicons name="sparkles" size={16} color="white" />
        </View>
        <TextInput
          placeholderTextColor={theme.colors.textSecondary}
          style={styles.searchPlaceholder}
          placeholder="Hỏi AI hoặc tìm kiếm"
        />
      </View>
    </View>
  );

  const renderNotesSection = () => (
    <View style={styles.notesSection}>
      <View style={styles.notesContent}>
        {/* Speech bubble with "Chia sẻ ghi chú" */}
        <View style={styles.speechBubble}>
          <Text style={[styles.speechBubbleText, { color: theme.colors.text }]}>Ghi chú</Text>
          <View style={styles.speechBubblePointer} />
        </View>

        {/* Main note bubble */}
        <View style={styles.noteBubble}>
          <View style={styles.noteEmoji}>
            <Text style={styles.emoji}>:)</Text>
          </View>
          <View style={styles.notePointer} />
        </View>

        {/* "Ghi chú của bạn" text */}
        <Text style={[styles.noteSubtext, { color: theme.colors.textSecondary }]}>
          Ghi chú của bạn
        </Text>
      </View>
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabHeaderContainer}>
      {/* Text "Tin nhắn" bên trái */}
      <Text style={styles.headerTitle}>Tin nhắn </Text>

      {/* Nút "Tin nhắn đang chờ" bên phải */}
      <TouchableOpacity onPress={() => router.push('/messages/pending-messages')}>
        <Text style={styles.pendingText}>Tin nhắn đang chờ</Text>
      </TouchableOpacity>
    </View>
  );

  const renderConversationItem = ({ item }: { item: Conversation }) => {
    const lastMessage = item.lastMessage;
    const otherUser = item.otherUser;
    const isUnread = (item.unreadCount || 0) > 0;

    // Show typing indicator if user is typing
    const displayText = lastMessage?.content || 'Chưa có tin nhắn';

    // Format timestamp for display
    const formatTime = (timestamp: string) => {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

      if (diffInHours < 24) {
        return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      } else if (diffInHours < 24 * 7) {
        return date.toLocaleDateString('vi-VN', { weekday: 'short' });
      } else {
        return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
      }
    };

    return (
      <TouchableOpacity
        style={styles.messageItem}
        onPress={() => handleMessagePress(otherUser.id)}
        onLongPress={() => handleLongPress(otherUser)}
      >
        <Avatar uri={otherUser.profile?.avatar} name={otherUser.username} size={50} />
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
                {otherUser.username}
              </Text>
            </View>
            {lastMessage?.createdAt && (
              <Text style={[styles.messageTime, { color: theme.colors.textSecondary }]}>
                {formatTime(lastMessage.createdAt)}
              </Text>
            )}
          </View>
          <Text
            style={[
              styles.messageText,
              {
                fontWeight: isUnread ? '600' : '400',
                color: isUnread ? theme.colors.text : theme.colors.textSecondary,
              },
            ]}
          >
            {displayText}
          </Text>
        </View>
        {isUnread && (
          <View style={styles.unreadContainer}>
            <View style={[styles.unreadBadge, { backgroundColor: theme.colors.primary }]}>
              <Text style={styles.unreadText}>{item.unreadCount}</Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      <SafeAreaView style={styles.safeArea}>
        {renderHeader()}

        <FlatList
          data={conversations || []}
          renderItem={({ item, index }) => {
            return renderConversationItem({ item: item as Conversation });
          }}
          keyExtractor={(item, index) => {
            return `messages-${(item as Conversation).conversationId}-${index}`;
          }}
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
                Chưa có tin nhắn từ người bạn đang theo dõi
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
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'red',
    marginRight: 4,
  },
  editButton: {
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
    paddingVertical: 2,
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
    color: '#8e8e8e',
    flex: 1,
  },
  notesSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  notesContent: {
    alignItems: 'center',
  },
  speechBubble: {
    backgroundColor: 'white',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 8,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  speechBubbleText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  speechBubblePointer: {
    position: 'absolute',
    bottom: -6,
    left: '50%',
    marginLeft: -6,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'white',
  },
  noteBubble: {
    position: 'relative',
    marginBottom: 8,
  },
  noteEmoji: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E3F2FD',
    borderWidth: 2,
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emoji: {
    fontSize: 16,
  },
  notePointer: {
    position: 'absolute',
    top: 58,
    left: 24,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#E3F2FD',
  },
  noteText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  noteSubtext: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
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
  pendingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1877F2', // xanh kiểu Facebook Messenger
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
