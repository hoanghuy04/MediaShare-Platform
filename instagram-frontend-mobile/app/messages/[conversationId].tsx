import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Text,
  TouchableOpacity,
  Image,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { useWebSocket } from '../../context/WebSocketContext';
import { ChatMessage } from '../../components/messages/ChatMessage';
import { MessageInput } from '../../components/messages/MessageInput';
import { TypingIndicator } from '../../components/messages/TypingIndicator';
import { ConnectionStatus } from '../../components/messages/ConnectionStatus';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { messageAPI } from '../../services/api';
import { Message } from '../../types';
import { showAlert } from '../../utils/helpers';

export default function ConversationScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuth();
  const {
    sendMessage: sendWebSocketMessage,
    sendReadReceipt,
    sendTyping,
    sendStopTyping,
    onMessage,
    onReadReceipt,
    onTyping,
    isConnected,
    connectionStatus,
    onConnectionStatusChange,
  } = useWebSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [localConnectionStatus, setLocalConnectionStatus] = useState<
    'connected' | 'connecting' | 'disconnected' | 'reconnecting'
  >('disconnected');
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [showDevelopmentModal, setShowDevelopmentModal] = useState(false);
  const [developmentTitle, setDevelopmentTitle] = useState('');
  const [developmentMessage, setDevelopmentMessage] = useState('');

  useEffect(() => {
    loadMessages();
  }, [conversationId]);

  // Monitor connection status
  useEffect(() => {
    setLocalConnectionStatus(connectionStatus);
  }, [connectionStatus]);

  // Set up WebSocket listeners
  useEffect(() => {
    // Listen for incoming messages
    const handleWebSocketMessage = (message: any) => {
      console.log('Received WebSocket message:', message);
      if (
        message.type === 'CHAT' &&
        (message.senderId === conversationId || message.receiverId === conversationId)
      ) {
        // Convert WebSocket message to Message type
        const newMessage: Message = {
          id: message.id || '',
          sender: {
            id: message.senderId,
            username: message.senderUsername || '',
            email: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            profile: {
              avatar: message.senderProfileImage,
            },
          },
          receiver: {
            id: user?.id || '',
            username: user?.username || '',
            email: user?.email || '',
            createdAt: user?.createdAt || new Date().toISOString(),
            updatedAt: user?.updatedAt || new Date().toISOString(),
          },
          content: message.content || '',
          mediaUrl: message.mediaUrl,
          isRead: message.status === 'READ',
          createdAt: message.timestamp,
        };

        setMessages(prev => {
          // Check if message already exists
          const exists = prev.some(msg => msg.id === message.id);
          if (exists) return prev;

          // If it's a message from current user, replace optimistic message
          if (message.senderId === user?.id) {
            return prev.map(msg => (msg.id.startsWith('temp-') ? newMessage : msg));
          }

          // Add new message from other user
          return [...prev, newMessage];
        });

        // Notify parent messages screen about new message for real-time updates
        // This will trigger the WebSocket message handler in messages.tsx
        console.log('New message received in conversation, should update messages screen');

        // Mark message as read if it's from the other user and not sent by current user
        if (message.senderId === conversationId && message.id && message.senderId !== user?.id) {
          sendReadReceipt(message.id, message.senderId);
        }
      }
    };

    // Listen for read receipts
    const handleReadReceipt = (messageId: string, senderId: string) => {
      if (senderId === conversationId) {
        setMessages(prev =>
          prev.map(msg => (msg.id === messageId ? { ...msg, isRead: true } : msg))
        );
      }
    };

    // Listen for typing indicators
    const handleTyping = (isTyping: boolean, userId: string) => {
      if (userId === conversationId) {
        setTypingUsers(prev => {
          if (isTyping) {
            return prev.includes(userId) ? prev : [...prev, userId];
          } else {
            return prev.filter(id => id !== userId);
          }
        });
      }
    };

    onMessage(handleWebSocketMessage);
    onReadReceipt(handleReadReceipt);
    onTyping(handleTyping);
  }, [conversationId, user?.id, onMessage, onReadReceipt, onTyping, sendReadReceipt]);

  const showDevelopmentNotice = (title: string, message: string) => {
    setDevelopmentTitle(title);
    setDevelopmentMessage(message);
    setShowDevelopmentModal(true);
  };

  const loadMessages = async () => {
    try {
      // conversationId is the other user's ID
      // Try to get messages, if no conversation exists, it will return empty
      const response = await messageAPI.getMessages(conversationId);
      setMessages(response.content.reverse() || []);

      // Mark all messages from other user as read via WebSocket
      if (response.content.length > 0) {
        const unreadMessages = response.content.filter(
          msg => msg.sender.id !== user?.id && !msg.isRead
        );

        // Send read receipts for unread messages via WebSocket
        if (isConnected && unreadMessages.length > 0) {
          console.log(`Sending read receipts for ${unreadMessages.length} unread messages`);
          unreadMessages.forEach(msg => {
            sendReadReceipt(msg.id, msg.sender.id);
          });
        } else if (unreadMessages.length > 0) {
          console.log(
            'WebSocket not connected, read receipts will be sent when connection is restored'
          );
        }
      }

      // If no messages exist, we need to get the other user's info
      if (response.content.length === 0) {
        // Load other user's profile info
        try {
          const { userAPI } = await import('../../services/api');
          const otherUserProfile = await userAPI.getUserProfile(conversationId);
          setOtherUser({
            id: otherUserProfile.id,
            username: otherUserProfile.username,
            profile: otherUserProfile.profile,
          });
        } catch (profileError) {
          console.error('Error loading user profile:', profileError);
        }
      } else {
        // Extract other user from messages
        const firstMessage = response.content[0];
        const other =
          firstMessage.sender.id === user?.id ? firstMessage.receiver : firstMessage.sender;
        setOtherUser(other);
      }
    } catch (error: any) {
      console.error('Error loading messages:', error);
      // Don't show error alert, just show empty conversation
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (content: string) => {
    try {
      // Create optimistic message immediately
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        sender: {
          id: user?.id || '',
          username: user?.username || '',
          email: user?.email || '',
          createdAt: user?.createdAt || new Date().toISOString(),
          updatedAt: user?.updatedAt || new Date().toISOString(),
          profile: {
            avatar: user?.profile?.avatar,
          },
        },
        receiver: {
          id: conversationId,
          username: otherUser?.username || '',
          email: otherUser?.email || '',
          createdAt: otherUser?.createdAt || new Date().toISOString(),
          updatedAt: otherUser?.updatedAt || new Date().toISOString(),
        },
        content,
        isRead: false,
        createdAt: new Date().toISOString(),
      };

      // Add optimistic message immediately
      console.log('Adding optimistic message:', optimisticMessage);
      setMessages(prev => [...prev, optimisticMessage]);

      if (isConnected) {
        // Send via WebSocket for real-time delivery
        sendWebSocketMessage(conversationId, content);
      } else {
        // Fallback to REST API if WebSocket is not connected
        try {
          const newMessage = await messageAPI.sendMessage({
            receiverId: conversationId,
            content,
          });

          // Replace optimistic message with real message
          setMessages(prev =>
            prev.map(msg => (msg.id === optimisticMessage.id ? newMessage : msg))
          );
        } catch (apiError) {
          // Remove optimistic message if API call fails
          setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
          throw apiError;
        }
      }
    } catch (error: any) {
      showAlert('Error', error.message);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <ChatMessage message={item} isOwn={item.sender.id === user?.id} />
  );

  const renderHeader = () => (
    <SafeAreaView style={[styles.header, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
      <View style={styles.headerContent}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.userInfo}
          onPress={() =>
            router.push(`/messages/conversation-settings?conversationId=${conversationId}`)
          }
        >
          <Image
            source={{ uri: otherUser?.profile?.avatar || 'https://via.placeholder.com/40' }}
            style={styles.avatar}
          />
          <View style={styles.userDetails}>
            <Text style={[styles.userName, { color: theme.colors.text }]}>
              {otherUser?.profile?.firstName || otherUser?.username || 'User'}
            </Text>
            <Text style={[styles.userHandle, { color: theme.colors.textSecondary }]}>
              @{otherUser?.username || 'user'}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() =>
              showDevelopmentNotice('Tạo nhóm', 'Tính năng thêm bạn đang được phát triển.')
            }
          >
            <Ionicons name="person-add" size={20} color={theme.colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => showDevelopmentNotice('Gọi', 'Tính năng gọi đang được phát triển.')}
          >
            <Ionicons name="call" size={20} color={theme.colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => showDevelopmentNotice('Video', 'Tính năng video đang được phát triển.')}
          >
            <Ionicons name="videocam" size={20} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );

  const renderContactInfo = () => (
    <View style={styles.contactInfo}>
      <Image
        source={{ uri: otherUser?.profile?.avatar || 'https://via.placeholder.com/100' }}
        style={styles.largeAvatar}
      />
      <Text style={[styles.contactName, { color: theme.colors.text }]}>
        {otherUser?.profile?.firstName || otherUser?.username || 'User'}
      </Text>
      <Text style={[styles.contactHandle, { color: theme.colors.textSecondary }]}>
        @{otherUser?.username || 'user'}
      </Text>
      <TouchableOpacity style={[styles.profileButton, { backgroundColor: theme.colors.border }]}>
        <Text style={[styles.profileButtonText, { color: theme.colors.text }]}>
          Xem trang cá nhân
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderDateSeparator = () => (
    <View style={styles.dateSeparator}>
      <View style={[styles.dateLine, { backgroundColor: theme.colors.border }]} />
      <Text style={[styles.dateText, { color: theme.colors.textSecondary }]}>04 thg 9, 2024</Text>
      <View style={[styles.dateLine, { backgroundColor: theme.colors.border }]} />
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {renderHeader()}
        <LoadingSpinner />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      keyboardVerticalOffset={0}
    >
      {renderHeader()}

      {messages.length === 0 && otherUser && renderContactInfo()}

      {messages.length > 0 && renderDateSeparator()}

      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messagesList}
        inverted={false}
        ListHeaderComponent={
          connectionStatus !== 'connected' ? (
            <ConnectionStatus
              status={connectionStatus}
              onRetry={() => {
                console.log('Retrying connection...');
              }}
            />
          ) : null
        }
        ListFooterComponent={
          typingUsers.length > 0 ? (
            <TypingIndicator isVisible={typingUsers.length > 0} multipleUsers={typingUsers} />
          ) : null
        }
      />
      <MessageInput
        onSend={handleSendMessage}
        onTyping={() => sendTyping(conversationId)}
        onStopTyping={() => sendStopTyping(conversationId)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
  userHandle: {
    fontSize: 14,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  contactInfo: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  largeAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  contactName: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 4,
  },
  contactHandle: {
    fontSize: 16,
    marginBottom: 20,
  },
  profileButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  profileButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    paddingHorizontal: 20,
  },
  dateLine: {
    flex: 1,
    height: 1,
  },
  dateText: {
    fontSize: 14,
    marginHorizontal: 16,
  },
  messagesList: {
    paddingVertical: 16,
    flexGrow: 1,
  },
});
