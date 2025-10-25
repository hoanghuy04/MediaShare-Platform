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

type MessageTab = 'messages' | 'pending';

export default function MessagesScreen() {
  const { theme } = useTheme();
  const { user: currentUser } = useAuth();
  const { onMessage, onTyping, onReadReceipt } = useWebSocket();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<MessageTab>('messages');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [suggestedAccounts, setSuggestedAccounts] = useState<UserProfile[]>([]);
  const [followingUsers, setFollowingUsers] = useState<UserProfile[]>([]);
  const [nonFollowingUsers, setNonFollowingUsers] = useState<UserProfile[]>([]);
  const [lastMessages, setLastMessages] = useState<{[userId: string]: string}>({});
  const [lastMessageTimestamps, setLastMessageTimestamps] = useState<{[userId: string]: string}>({});
  const [unreadMessages, setUnreadMessages] = useState<{[userId: string]: boolean}>({});
  const [typingUsers, setTypingUsers] = useState<{[userId: string]: boolean}>({});
  const typingTimeouts = useRef<{[userId: string]: number}>({});

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
      
      if (message.type === 'CHAT') {
        // Update last message for the conversation
        const senderId = message.senderId;
        const receiverId = message.receiverId;
        const otherUserId = senderId === currentUser?.id ? receiverId : senderId;
        
        console.log('Updating last message for user:', otherUserId, 'content:', message.content);
        
        setLastMessages(prev => ({
          ...prev,
          [otherUserId]: message.content || ''
        }));
        
        // Update timestamp for sorting
        setLastMessageTimestamps(prev => ({
          ...prev,
          [otherUserId]: message.timestamp || new Date().toISOString()
        }));
        
        // Update unread status - mark as unread if message is from other user
        const isFromOtherUser = senderId !== currentUser?.id;
        setUnreadMessages(prev => ({
          ...prev,
          [otherUserId]: isFromOtherUser
        }));
        
        // If conversation was deleted and we received a new message, refresh to show restored conversation
        // Backend automatically restores deleted conversations when new messages arrive
        if (isFromOtherUser) {
          // Check if this conversation was previously deleted (not in current conversations list)
          const conversationExists = conversations?.some((conv: any) => conv.conversationId === otherUserId);
          if (!conversationExists) {
            console.log('Conversation was deleted and received new message, refreshing to show restored conversation');
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
          [userId]: true
        }));
        
        // Auto-clear typing indicator after 3 seconds
        typingTimeouts.current[userId] = setTimeout(() => {
          setTypingUsers(prev => ({
            ...prev,
            [userId]: false
          }));
          delete typingTimeouts.current[userId];
        }, 3000);
      } else {
        // Clear typing indicator immediately
        setTypingUsers(prev => ({
          ...prev,
          [userId]: false
        }));
      }
    };

    const handleReadReceipt = (messageId: string, senderId: string) => {
      console.log('Messages screen received read receipt:', { messageId, senderId });
      // Update unread status when message is read
      setUnreadMessages(prev => ({
        ...prev,
        [senderId]: false
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
    };
  }, [currentUser?.id, onMessage, onTyping, onReadReceipt]);

  // Refresh data when screen comes into focus (e.g., returning from conversation)
  useFocusEffect(
    React.useCallback(() => {
      // Refresh last messages when returning from conversation to update read status
      if (followingUsers.length > 0) {
        loadLastMessagesForUsers(followingUsers);
      }
    }, [followingUsers])
  );

  // Auto switch to messages tab when user is moved from pending to following
  // Only switch if we just moved a user from pending to following
  useEffect(() => {
    // This effect will be handled in handleMessagePress and handleFollowUser instead
    // to avoid interfering with manual tab switching
  }, []);

  const loadData = async () => {
    try {
      await Promise.all([
        refresh(),
        loadSuggestedAccounts(),
        loadFollowingUsers(),
        loadNonFollowingUsers(),
        loadLastMessages(),
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadSuggestedAccounts = async (currentFollowingUsers?: UserProfile[]) => {
    try {
      // Get more users to filter from
      const response = await userAPI.searchUsers('', 0, 20);
      const allUsers = response.content || [];
      
      // Use provided following users or current state
      const following = currentFollowingUsers || followingUsers;
      
      // Filter out current user and users already being followed
      const suggested = allUsers.filter(user => 
        user.id !== currentUser?.id && 
        !following.some(followingUser => followingUser.id === user.id)
      );
      
      // Take first 5 suggestions
      setSuggestedAccounts(suggested.slice(0, 5));
    } catch (error) {
      console.error('Error loading suggested accounts:', error);
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
        // Reload suggested accounts with current following users
        await loadSuggestedAccounts(following || []);
      }
    } catch (error) {
      console.error('Error loading following users:', error);
    }
  };

  const loadNonFollowingUsers = async () => {
    try {
      if (currentUser?.id) {
        // Get users that current user is not following
        const response = await userAPI.searchUsers('', 0, 20);
        const allUsers = response.content || [];
        const nonFollowing = allUsers.filter(user => 
          user.id !== currentUser.id && 
          !followingUsers.some(following => following.id === user.id)
        );
        setNonFollowingUsers(nonFollowing.slice(0, 10));
      }
    } catch (error) {
      console.error('Error loading non-following users:', error);
    }
  };

  const loadLastMessagesForUsers = async (users: UserProfile[]) => {
    try {
      if (!currentUser?.id) return;
      
      const lastMessagesMap: {[userId: string]: string} = {};
      const lastTimestampsMap: {[userId: string]: string} = {};
      const unreadMap: {[userId: string]: boolean} = {};
      
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
      // Refresh data based on active tab
      if (activeTab === 'messages') {
        await Promise.all([
          loadFollowingUsers(),
          loadLastMessagesForUsers(followingUsers),
        ]);
      } else {
        await Promise.all([
          loadNonFollowingUsers(),
          loadSuggestedAccounts(),
        ]);
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleMessagePress = (userId: string) => {
    // Mark messages as read when entering conversation
    setUnreadMessages(prev => ({
      ...prev,
      [userId]: false
    }));
    
    // Check if user is in nonFollowingUsers (pending tab)
    const isNonFollowing = nonFollowingUsers.some(user => user.id === userId);
    
    if (isNonFollowing) {
      // Move user from nonFollowingUsers to followingUsers when starting conversation
      const userToMove = nonFollowingUsers.find(user => user.id === userId);
      if (userToMove) {
        setFollowingUsers(prev => {
          // Check if user already exists to avoid duplicates
          const exists = prev.some(user => user.id === userId);
          return exists ? prev : [...prev, userToMove];
        });
        setNonFollowingUsers(prev => prev.filter(user => user.id !== userId));
        
        // Remove from suggested accounts if exists
        setSuggestedAccounts(prev => prev.filter(user => user.id !== userId));
        
        // Switch to messages tab since we moved a user from pending to following
        setActiveTab('messages');
      }
    }
    
    // Navigate directly to conversation using the other user's ID as conversationId
    router.push(`/messages/${userId}`);
  };

  const handleLongPress = (conversation: UserProfile | Conversation) => {
    const isConversation = 'conversationId' in conversation;
    const conversationId = isConversation ? conversation.conversationId : conversation.id;
    const username = isConversation ? conversation.otherUser.username : conversation.username;
    const isPinned = isConversation ? conversation.isPinned : false;
    
    const options = [];
    
    if (isPinned) {
      options.push({
        text: 'Unpin Conversation',
        onPress: () => handleUnpinConversation(conversationId),
      });
    } else {
      options.push({
        text: 'Pin Conversation',
        onPress: () => handlePinConversation(conversationId),
      });
    }
    
    options.push({
      text: 'Delete Conversation',
      style: 'destructive' as const,
      onPress: () => handleDeleteConversation(conversationId),
    });
    
    options.push({
      text: 'Cancel',
      style: 'cancel' as const,
    });
    
    Alert.alert(
      'Conversation Options',
      `Options for ${username}`,
      options,
      { cancelable: true }
    );
  };

  const handlePinConversation = async (conversationId: string) => {
    try {
      if (!currentUser?.id) {
        showAlert('Error', 'User not authenticated');
        return;
      }
      await messageAPI.pinConversation(conversationId, currentUser.id);
      await refresh(); // Reload danh sách
      showAlert('Success', 'Conversation pinned');
    } catch (error: any) {
      showAlert('Error', error.message);
    }
  };

  const handleUnpinConversation = async (conversationId: string) => {
    try {
      if (!currentUser?.id) {
        showAlert('Error', 'User not authenticated');
        return;
      }
      await messageAPI.unpinConversation(conversationId, currentUser.id);
      await refresh(); // Reload danh sách
      showAlert('Success', 'Conversation unpinned');
    } catch (error: any) {
      showAlert('Error', error.message);
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    Alert.alert(
      'Delete Conversation',
      'This will hide the conversation. It will reappear if you receive a new message.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              if (!currentUser?.id) {
                showAlert('Error', 'User not authenticated');
                return;
              }
              await messageAPI.deleteConversation(conversationId, currentUser.id);
              await refresh();
              showAlert('Success', 'Conversation deleted');
            } catch (error: any) {
              showAlert('Error', error.message);
            }
          }
        }
      ]
    );
  };

  const handleFollowUser = async (userId: string) => {
    try {
      await userAPI.followUser(userId);
      
      // Move user from nonFollowingUsers to followingUsers
      const userToMove = nonFollowingUsers.find(user => user.id === userId);
      if (userToMove) {
        const updatedFollowingUsers = [...followingUsers, userToMove];
        setFollowingUsers(updatedFollowingUsers);
        setNonFollowingUsers(prev => prev.filter(user => user.id !== userId));
        
        // Remove from suggested accounts if exists
        setSuggestedAccounts(prev => prev.filter(user => user.id !== userId));
        
        // Reload suggested accounts with updated following list
        await loadSuggestedAccounts(updatedFollowingUsers);
        
        // Switch to messages tab since we moved a user from pending to following
        setActiveTab('messages');
      }
      
      // Load last message for the newly followed user
      if (userToMove) {
        await loadLastMessagesForUsers([userToMove]);
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
        <TextInput placeholderTextColor={theme.colors.textSecondary} style={styles.searchPlaceholder} placeholder="Hỏi AI hoặc tìm kiếm" />
      </View>
    </View>
  );

  const renderNotesSection = () => (
    <View style={styles.notesSection}>
      <View style={styles.notesContent}>
        {/* Speech bubble with "Chia sẻ ghi chú" */}
        <View style={styles.speechBubble}>
          <Text style={[styles.speechBubbleText, { color: theme.colors.text }]}>Chia sẻ ghi chú</Text>
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
        <Text style={[styles.noteSubtext, { color: theme.colors.textSecondary }]}>Ghi chú của bạn</Text>
      </View>
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'messages' && styles.activeTab]}
        onPress={() => setActiveTab('messages')}
      >
        <Text style={[styles.tabText, activeTab === 'messages' && styles.activeTabText]}>
          Tin nhắn
        </Text>
        {activeTab === 'messages' && <View style={styles.tabIndicator} />}
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
        onPress={() => setActiveTab('pending')}
      >
        <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>
          Tin nhắn đang chờ
        </Text>
        {activeTab === 'pending' && <View style={styles.tabIndicator} />}
      </TouchableOpacity>
    </View>
  );

  // Sort users by last message timestamp (newest first)
  const getSortedUsers = (users: UserProfile[]) => {
    return [...users].sort((a, b) => {
      const timestampA = lastMessageTimestamps[a.id];
      const timestampB = lastMessageTimestamps[b.id];
      
      // If both have timestamps, sort by newest first
      if (timestampA && timestampB) {
        return new Date(timestampB).getTime() - new Date(timestampA).getTime();
      }
      
      // If only one has timestamp, prioritize it
      if (timestampA && !timestampB) return -1;
      if (!timestampA && timestampB) return 1;
      
      // If neither has timestamp, maintain original order
      return 0;
    });
  };

  const renderConversationItem = ({ item }: { item: Conversation }) => {
    const lastMessage = item.lastMessage;
    const otherUser = item.otherUser;
    const isUnread = (item.unreadCount || 0) > 0;
    const isPinned = item.isPinned || false;
    
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
              <Text style={[
                styles.messageUsername, 
                { 
                  color: theme.colors.text,
                  fontWeight: isUnread ? '700' : '600',
                }
              ]}>
                {otherUser.username}
              </Text>
              {/* Add pin icon if conversation is pinned */}
              {isPinned && (
                <Ionicons 
                  name="pin" 
                  size={12} 
                  color={theme.colors.primary} 
                  style={styles.pinIcon}
                />
              )}
            </View>
            {lastMessage?.createdAt && (
              <Text style={[styles.messageTime, { color: theme.colors.textSecondary }]}>
                {formatTime(lastMessage.createdAt)}
              </Text>
            )}
          </View>
          <Text style={[
            styles.messageText, 
            { 
              fontWeight: isUnread ? '600' : '400',
              color: isUnread ? theme.colors.text : theme.colors.textSecondary,
            }
          ]}>
            {displayText}
          </Text>
        </View>
        {isUnread && (
          <View style={[styles.unreadBadge, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.unreadText}>{item.unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderMessageItem = ({ item }: { item: UserProfile }) => {
    const lastMessage = lastMessages[item.id];
    const lastTimestamp = lastMessageTimestamps[item.id];
    const isUnread = unreadMessages[item.id] || false;
    const isTyping = typingUsers[item.id] || false;
    
    // Show typing indicator if user is typing
    const displayText = isTyping ? 'Đang nhập...' : (lastMessage || 'Chưa có tin nhắn');
    
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
        onPress={() => handleMessagePress(item.id)}
        onLongPress={() => handleLongPress(item)}
      >
        <Avatar uri={item.profile?.avatar} name={item.username} size={50} />
        <View style={styles.messageContent}>
          <View style={styles.messageHeader}>
            <View style={styles.messageHeaderLeft}>
              <Text style={[
                styles.messageUsername, 
                { 
                  color: theme.colors.text,
                  fontWeight: isUnread ? '700' : '600',
                }
              ]}>
                {item.username}
              </Text>
              {/* Pin icon not available for UserProfile items */}
            </View>
            {lastTimestamp && (
              <Text style={[styles.messageTime, { color: theme.colors.textSecondary }]}>
                {formatTime(lastTimestamp)}
              </Text>
            )}
          </View>
          <Text style={[
            styles.messageText, 
            { 
              fontWeight: isUnread ? '600' : '400',
              color: isTyping ? theme.colors.primary : (isUnread ? theme.colors.text : theme.colors.textSecondary),
              fontStyle: isTyping ? 'italic' : 'normal',
            }
          ]}>
            {displayText}
          </Text>
        </View>
        <TouchableOpacity style={styles.cameraButton}>
          <Ionicons name="camera-outline" size={20} color={theme.colors.text} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderSuggestedAccounts = () => (
    <View style={styles.suggestedSection}>
      <View style={styles.suggestedHeader}>
        <Text style={[styles.suggestedTitle, { color: theme.colors.text }]}>Tài khoản nên theo dõi</Text>
        <TouchableOpacity>
          <Text style={[styles.seeAllText, { color: theme.colors.primary }]}>Xem tất cả</Text>
        </TouchableOpacity>
      </View>
      {suggestedAccounts.map((account, index) => (
        <View key={`suggested-${account.id}-${index}`} style={styles.suggestedItem}>
          <Avatar uri={account.profile?.avatar} name={account.username} size={40} />
          <View style={styles.suggestedInfo}>
            <Text style={[styles.suggestedUsername, { color: theme.colors.text }]}>{account.username}</Text>
            <Text style={[styles.suggestedFullName, { color: theme.colors.textSecondary }]}>
              {account.profile?.firstName && account.profile?.lastName 
                ? `${account.profile.firstName} ${account.profile.lastName}`
                : account.username
              }
            </Text>
          </View>
          <View style={styles.suggestedActions}>
            <TouchableOpacity 
              style={styles.followButton}
              onPress={() => handleFollowUser(account.id)}
            >
              <Text style={styles.followButtonText}>Theo dõi</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dismissButton}>
              <Ionicons name="close" size={16} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      <SafeAreaView style={styles.safeArea}>
        {renderHeader()}
        
        <FlatList
          data={activeTab === 'messages' ? (conversations || []) : getSortedUsers(nonFollowingUsers)}
          renderItem={({ item, index }) => {
            if (activeTab === 'messages') {
              return renderConversationItem({ item: item as Conversation });
            } else {
              return renderMessageItem({ item: item as UserProfile });
            }
          }}
          keyExtractor={(item, index) => {
            if (activeTab === 'messages') {
              return `${activeTab}-${(item as Conversation).conversationId}-${index}`;
            } else {
              return `${activeTab}-${(item as UserProfile).id}-${index}`;
            }
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
                {activeTab === 'messages' 
                  ? 'Chưa có tin nhắn từ người bạn đang theo dõi'
                  : 'Chưa có tin nhắn đang chờ'
                }
              </Text>
            </View>
          }
          ListFooterComponent={renderSuggestedAccounts}
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
  activeTab: {
    // Active tab styling
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
  pinIcon: {
    marginLeft: 4,
  },
  unreadBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
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
  suggestedSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  suggestedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  suggestedTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  suggestedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  suggestedInfo: {
    flex: 1,
    marginLeft: 12,
  },
  suggestedUsername: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  suggestedFullName: {
    fontSize: 12,
  },
  suggestedActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  followButton: {
    backgroundColor: '#0095F6',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 4,
    marginRight: 8,
  },
  followButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  dismissButton: {
    padding: 4,
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

