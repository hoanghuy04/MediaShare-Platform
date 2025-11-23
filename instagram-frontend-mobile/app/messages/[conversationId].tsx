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
import { messageAPI, userAPI, messageRequestAPI } from '../../services/api';
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
  const [actualConversationId, setActualConversationId] = useState<string>(conversationId);
  const [isNewConversation, setIsNewConversation] = useState(false); // Track if this is a new conversation (no existing conversation)
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
      // Check if message is for this conversation (use otherUser.id if available, fallback to conversationId)
      const otherUserId = otherUser?.id || conversationId;
      if (
        message.type === 'CHAT' &&
        (message.senderId === otherUserId || message.receiverId === otherUserId)
      ) {
        // Convert WebSocket message to Message type
        // Safety check: ensure we have sender info
        if (!message.senderId) {
          console.warn('WebSocket message missing senderId:', message);
          return;
        }
        
        const newMessage: Message = {
          id: message.id || '',
          sender: {
            id: message.senderId,
            username: message.senderUsername || '',
            avatar: message.senderProfileImage,
            isVerified: false,
          },
          content: message.content || '',
          mediaUrl: message.mediaUrl,
          readBy: message.status === 'READ' ? [user?.id || ''] : [],
          createdAt: message.timestamp,
          isDeleted: false,
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

        // Mark message as read if it's from the other user and not sent by current user
        if (message.senderId === otherUserId && message.id && message.senderId !== user?.id) {
          sendReadReceipt(message.id, message.senderId);
        }
      }
    };

    // Listen for read receipts
    const handleReadReceipt = (messageId: string, senderId: string) => {
      const otherUserId = otherUser?.id || conversationId;
      if (senderId === otherUserId) {
        setMessages(prev =>
          prev.map(msg =>
            msg.id === messageId ? { ...msg, readBy: [...msg.readBy, senderId] } : msg
          )
        );
      }
    };

    // Listen for typing indicators
    const handleTyping = (isTyping: boolean, userId: string) => {
      const otherUserId = otherUser?.id || conversationId;
      if (userId === otherUserId) {
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
  }, [conversationId, otherUser, user?.id, onMessage, onReadReceipt, onTyping, sendReadReceipt]);

  const showDevelopmentNotice = (title: string, message: string) => {
    setDevelopmentTitle(title);
    setDevelopmentMessage(message);
    setShowDevelopmentModal(true);
  };

  const loadMessages = async () => {
    try {
      // conversationId might be the other user's ID or actual conversation ID
      // First, try to get or create direct conversation if conversationId looks like a userId
      let actualConversationId = conversationId;
      let isNewConv = false; // Track if this is a new conversation locally
      
      try {
        // Try to get conversation as-is first
        const conversation = await messageAPI.getConversation(conversationId);
        actualConversationId = conversation.id;
        
        // Set other user from participants
        if (conversation.participants && conversation.participants.length > 0) {
          const otherUserFromConv = conversation.participants.find(p => p.userId !== user?.id);
          if (otherUserFromConv) {
            setOtherUser({
              id: otherUserFromConv.userId,
              username: otherUserFromConv.username,
              email: '',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              profile: { avatar: otherUserFromConv.avatar },
            });
          }
        }
      } catch (error: any) {
        // If conversation not found (404), this is a new conversation
        // The conversationId is actually the other user's ID
        if (error.response?.status === 404) {
          console.log('Conversation not found. This is a new conversation with user:', conversationId);
          
          // Mark this as a new conversation (no existing conversation)
          isNewConv = true;
          setIsNewConversation(true);
          
          // Load the other user's profile
          try {
            const userProfile = await userAPI.getUserProfile(conversationId);
            setOtherUser(userProfile);
            
            // No actual conversation ID yet - will be created when first message is sent
            // Keep conversationId as is (it's the userId)
            actualConversationId = conversationId;
          } catch (userError) {
            console.error('Failed to fetch user profile:', userError);
            showAlert('Error', 'Unable to load user information. Please try again.');
            router.back();
            return;
          }
        } else {
          throw error;
        }
      }
      
      // Save the actual conversation ID to state
      setActualConversationId(actualConversationId);
      
      // If this is a new conversation, try to load pending messages
      if (isNewConv) {
        try {
          // Try to load pending messages from message request
          const pendingMessages = await messageRequestAPI.getPendingMessages(user?.id || '', conversationId);
          
          if (pendingMessages && pendingMessages.length > 0) {
            console.log(`Loaded ${pendingMessages.length} pending messages`);
            setMessages(pendingMessages);
          } else {
            console.log('No pending messages found');
            setMessages([]); // Empty messages for new conversation
          }
        } catch (error) {
          console.error('Error loading pending messages:', error);
          setMessages([]); // Empty messages on error
        }
        
        setIsLoading(false);
        return;
      }
      
      // Now load messages with the actual conversation ID
      const response = await messageAPI.getMessages(actualConversationId);
      setMessages(response.content.reverse() || []);

      // Mark all messages from other user as read via WebSocket
      if (response.content.length > 0) {
        const unreadMessages = response.content.filter(
          msg => msg.sender.id !== user?.id && !msg.readBy.includes(user?.id || '')
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
        
        // Extract other user from messages if not already set
        if (!otherUser && response.content.length > 0) {
          // If we have messages but no otherUser set, try to infer from the first message
          // where the sender is not the current user
          const messageFromOther = response.content.find(msg => msg.sender.id !== user?.id);
          if (messageFromOther) {
            // We have the sender as UserSummary, need to fetch full profile for consistency
            try {
              const userProfile = await userAPI.getUserProfile(messageFromOther.sender.id);
              setOtherUser(userProfile);
            } catch (error) {
              console.error('Failed to fetch other user profile:', error);
            }
          }
        }
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
    if (!otherUser) {
      console.error('Cannot send message: other user not loaded');
      showAlert('Error', 'Unable to send message. Please try again.');
      return;
    }

    try {
      // Create optimistic message immediately
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        sender: {
          id: user?.id || '',
          username: user?.username || '',
          avatar: user?.profile?.avatar,
          isVerified: user?.verified || false,
        },
        content,
        readBy: [],
        createdAt: new Date().toISOString(),
        isDeleted: false,
      };

      // Add optimistic message immediately
      console.log('Adding optimistic message:', optimisticMessage);
      setMessages(prev => [...prev, optimisticMessage]);

      // If this is a new conversation (no existing conversation), send via direct message endpoint
      // This will create a message request (if users are not connected)
      if (isNewConversation) {
        console.log('Sending message to new conversation (creates message request if not connected)');
        try {
          const newMessage = await messageAPI.sendDirectMessage(
            otherUser.id,
            content
          );
          
          console.log('Received message from API:', newMessage);

          // Safety check: ensure message has sender
          if (!newMessage.sender) {
            console.error('API returned message without sender:', newMessage);
            // Keep optimistic message if API response is invalid
            return;
          }

          // Replace optimistic message with real message
          setMessages(prev =>
            prev.map(msg => (msg.id === optimisticMessage.id ? newMessage : msg))
          );

          // If backend returned a conversationId, update and mark as no longer new
          if (newMessage.conversationId) {
            console.log('Conversation created:', newMessage.conversationId);
            setActualConversationId(newMessage.conversationId);
            setIsNewConversation(false);
          } else {
            console.log('Message sent as request (no conversation created yet)');
            // Show info that message is sent as request (needs acceptance)
            showAlert(
              'Message Sent',
              'Your message has been sent. The recipient will need to accept your message request before you can continue chatting.'
            );
          }
        } catch (apiError: any) {
          // Remove optimistic message if API call fails
          setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
          throw apiError;
        }
      } else {
        // Existing conversation - use normal flow
        if (isConnected) {
          // Send via WebSocket for real-time delivery to the other user
          console.log('Sending WebSocket message to user:', otherUser.id);
          sendWebSocketMessage(otherUser.id, content);
        } else {
          // Fallback to REST API if WebSocket is not connected
          console.log('WebSocket not connected, using REST API with conversation:', actualConversationId);
          try {
            const newMessage = await messageAPI.sendMessage(actualConversationId, content);
            console.log('Received message from API:', newMessage);

            // Safety check: ensure message has sender
            if (!newMessage.sender) {
              console.error('API returned message without sender:', newMessage);
              // Keep optimistic message
              return;
            }

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
      }
    } catch (error: any) {
      showAlert('Error', error.message || 'Failed to send message');
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    // Safety check: ensure sender exists
    if (!item.sender) {
      console.warn('Message missing sender:', item);
      return null;
    }
    return <ChatMessage message={item} isOwn={item.sender.id === user?.id} />;
  };

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
