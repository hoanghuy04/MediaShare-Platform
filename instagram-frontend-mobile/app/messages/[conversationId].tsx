import React, { useEffect, useState, useRef, useCallback } from 'react';
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
import { Message, UserProfile } from '../../types';
import { showAlert } from '../../utils/helpers';

export default function ConversationScreen() {
  const params = useLocalSearchParams<{
    conversationId?: string | string[];
    isNewConversation?: string | string[];
    requestId?: string | string[];
  }>();
  const normalizeParam = (value?: string | string[]): string | undefined =>
    Array.isArray(value) ? value[0] : value;
  const routeConversationId = normalizeParam(params.conversationId) || '';
  const routePendingFlag = normalizeParam(params.isNewConversation);
  const routeRequestId = normalizeParam(params.requestId);
  const wantsPendingRoute = routePendingFlag === 'true';
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
  const [otherUser, setOtherUser] = useState<UserProfile | null>(null);
  const [peerUserId, setPeerUserId] = useState<string | null>(
    wantsPendingRoute ? routeConversationId : null
  );
  const [actualConversationId, setActualConversationId] = useState<string | null>(
    wantsPendingRoute ? null : routeConversationId
  );
  const [isNewConversation, setIsNewConversation] = useState(wantsPendingRoute);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [showDevelopmentModal, setShowDevelopmentModal] = useState(false);
  const [developmentTitle, setDevelopmentTitle] = useState('');
  const [developmentMessage, setDevelopmentMessage] = useState('');

  const showDevelopmentNotice = (title: string, message: string) => {
    setDevelopmentTitle(title);
    setDevelopmentMessage(message);
    setShowDevelopmentModal(true);
  };

  const ensureMessageSender = useCallback(
    (message: Message): Message => {
      const existingSender = (message as any).sender;
      if (existingSender && existingSender.id) {
        return message;
      }

      if (user) {
        return {
          ...message,
          sender: {
            id: user.id,
            username: user.username,
            avatar: user.profile?.avatar,
            isVerified: !!user.isVerified,
          },
        };
      }

      return message;
    },
    [user]
  );

  const loadPendingThread = useCallback(
    async (targetUserId: string) => {
      if (!targetUserId || !user?.id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        setIsNewConversation(true);
        setActualConversationId(null);
        setPeerUserId(targetUserId);

        if (!otherUser || otherUser.id !== targetUserId) {
          const profile = await userAPI.getUserProfile(targetUserId);
          setOtherUser(profile);
        }

        const pendingMessages = await messageRequestAPI.getPendingMessages(user.id, targetUserId);
        const orderedMessages = [...pendingMessages]
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
          .map(ensureMessageSender);
        setMessages(orderedMessages);
      } catch (error) {
        console.error('Error loading pending messages:', error);
        setMessages([]);
      } finally {
        setIsLoading(false);
      }
    },
    [ensureMessageSender, otherUser, user]
  );

  const loadExistingThread = useCallback(
    async (conversationKey: string) => {
      if (!conversationKey) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const conversation = await messageAPI.getConversation(conversationKey);
        setActualConversationId(conversation.id);
        setIsNewConversation(false);

        if (conversation.participants && conversation.participants.length > 0) {
          const otherParticipant =
            conversation.participants.find(p => p.userId !== user?.id) ||
            conversation.participants[0];

          if (otherParticipant) {
            setPeerUserId(otherParticipant.userId);
            setOtherUser(prev =>
              prev && prev.id === otherParticipant.userId
                ? prev
                : {
                    id: otherParticipant.userId,
                    username: otherParticipant.username,
                    email: '',
                    profile: { avatar: otherParticipant.avatar },
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    isVerified: otherParticipant.isVerified,
                  }
            );
          }
        }

        const response = await messageAPI.getMessages(conversation.id);
        const orderedMessages = [...(response.content || [])].reverse().map(ensureMessageSender);
        setMessages(orderedMessages);

        if (response.content && response.content.length > 0) {
          const unreadMessages = response.content.filter(
            msg => msg.sender.id !== user?.id && !msg.readBy.includes(user?.id || '')
          );

          if (!isNewConversation && isConnected && unreadMessages.length > 0) {
            unreadMessages.forEach(msg => {
              sendReadReceipt(msg.id, msg.sender.id);
            });
          }
        }
      } catch (error: any) {
        if (error?.response?.status === 404) {
          await loadPendingThread(conversationKey);
          return;
        }

        console.error('Error loading messages:', error);
        setMessages([]);
      } finally {
        setIsLoading(false);
      }
    },
    [
      ensureMessageSender,
      isConnected,
      isNewConversation,
      loadPendingThread,
      messageAPI,
      sendReadReceipt,
      user,
    ]
  );

  const transitionToConversation = useCallback(
    (nextConversationId: string) => {
      if (!nextConversationId) {
        return;
      }
      setIsNewConversation(false);
      setActualConversationId(nextConversationId);
      router.replace({
        pathname: '/messages/[conversationId]',
        params: { conversationId: nextConversationId },
      });
      loadExistingThread(nextConversationId);
    },
    [loadExistingThread, router]
  );

  // Set up WebSocket listeners
  useEffect(() => {
    const handleWebSocketMessage = (message: any) => {
      const peerId = otherUser?.id || peerUserId || routeConversationId;
      const matchesPeer = peerId && (message.senderId === peerId || message.receiverId === peerId);
      const matchesConversation =
        !!message.conversationId &&
        !!actualConversationId &&
        message.conversationId === actualConversationId;

      if (message.type !== 'CHAT' || (!matchesPeer && !matchesConversation)) {
        return;
      }

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
        conversationId: message.conversationId,
        content: message.content || '',
        mediaUrl: message.mediaUrl,
        readBy: message.status === 'READ' ? [user?.id || ''] : [],
        createdAt: message.timestamp,
        isDeleted: false,
      };

      setMessages(prev => {
        const exists = prev.some(msg => msg.id === message.id);
        if (exists) return prev;

        if (message.senderId === user?.id) {
          return prev.map(msg => (msg.id.startsWith('temp-') ? newMessage : msg));
        }

        return [...prev, newMessage];
      });

      if (isNewConversation && message.conversationId) {
        transitionToConversation(message.conversationId);
      }

      if (
        !isNewConversation &&
        peerId &&
        message.senderId === peerId &&
        message.id &&
        message.senderId !== user?.id
      ) {
        sendReadReceipt(message.id, message.senderId);
      }
    };

    const handleReadReceipt = (messageId: string, senderId: string) => {
      const peerId = otherUser?.id || peerUserId || routeConversationId;
      if (!peerId || senderId !== peerId) {
        return;
      }
      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageId ? { ...msg, readBy: [...msg.readBy, senderId] } : msg
        )
      );
    };

    const handleTyping = (isTyping: boolean, userId: string) => {
      const peerId = otherUser?.id || peerUserId || routeConversationId;
      if (!peerId || userId !== peerId) {
        return;
      }

      setTypingUsers(prev => {
        if (isTyping) {
          return prev.includes(userId) ? prev : [...prev, userId];
        }
        return prev.filter(id => id !== userId);
      });
    };

    onMessage(handleWebSocketMessage);
    onReadReceipt(handleReadReceipt);
    onTyping(handleTyping);
  }, [
    actualConversationId,
    isNewConversation,
    onMessage,
    onReadReceipt,
    onTyping,
    otherUser,
    peerUserId,
    routeConversationId,
    sendReadReceipt,
    transitionToConversation,
    user?.id,
  ]);

  useEffect(() => {
    if (!routeConversationId) {
      setIsLoading(false);
      return;
    }

    if (wantsPendingRoute) {
      loadPendingThread(routeConversationId);
    } else {
      loadExistingThread(routeConversationId);
    }
  }, [routeConversationId, wantsPendingRoute, loadExistingThread, loadPendingThread]);

  const handleSendMessage = async (content: string) => {
    const targetUserId = otherUser?.id || peerUserId || routeConversationId;

    if (!targetUserId) {
      showAlert('Error', 'Unable to determine recipient.');
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
          isVerified: user?.isVerified || false,
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
        console.log(
          'Sending message to new conversation (creates message request if not connected)'
        );
        try {
          const newMessage = await messageAPI.sendDirectMessage(targetUserId, content);

          console.log('Received message from API:', newMessage);

          // Safety check: ensure message has sender
          if (!newMessage.sender) {
            console.error('API returned message without sender:', newMessage);
            // Keep optimistic message if API response is invalid
            return;
          }

          // Replace optimistic message with real message
          setMessages(prev =>
            prev.map(msg =>
              msg.id === optimisticMessage.id ? ensureMessageSender(newMessage) : msg
            )
          );

          // If backend returned a conversationId, update and mark as no longer new
          if (newMessage.conversationId) {
            console.log('Conversation created:', newMessage.conversationId);
            transitionToConversation(newMessage.conversationId);
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
        if (isConnected && peerUserId) {
          console.log('Sending WebSocket message to user:', peerUserId);
          sendWebSocketMessage(peerUserId, content);
        } else {
          if (!actualConversationId) {
            console.warn('Missing conversationId for existing conversation send');
            setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
            showAlert('Error', 'Conversation is still syncing. Please try again.');
            return;
          }
          // Fallback to REST API if WebSocket is not connected
          console.log(
            'WebSocket not connected, using REST API with conversation:',
            actualConversationId
          );
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
              prev.map(msg =>
                msg.id === optimisticMessage.id ? ensureMessageSender(newMessage) : msg
              )
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
            router.push(
              `/messages/conversation-settings?conversationId=${
                actualConversationId || routeConversationId
              }`
            )
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
            {isNewConversation && (
              <View style={styles.pendingChip}>
                <Text style={styles.pendingChipText}>Pending</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        {!isNewConversation && (
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
              onPress={() =>
                showDevelopmentNotice('Video', 'Tính năng video đang được phát triển.')
              }
            >
              <Ionicons name="videocam" size={20} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
        )}
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

  const renderPendingBanner = () => (
    <View style={[styles.pendingBanner, { backgroundColor: theme.colors.surface }]}>
      <Ionicons name="time-outline" size={18} color={theme.colors.warning || '#FF9500'} />
      <View style={styles.pendingBannerText}>
        <Text style={[styles.pendingBannerTitle, { color: theme.colors.text }]}>
          Tin nhắn đang chờ
        </Text>
        <Text style={[styles.pendingBannerSubtitle, { color: theme.colors.textSecondary }]}>
          Người nhận cần chấp nhận để bắt đầu cuộc trò chuyện.
        </Text>
      </View>
    </View>
  );

  const renderDateSeparator = () => (
    <View style={styles.dateSeparator}>
      <View style={[styles.dateLine, { backgroundColor: theme.colors.border }]} />
      <Text style={[styles.dateText, { color: theme.colors.textSecondary }]}>04 thg 9, 2024</Text>
      <View style={[styles.dateLine, { backgroundColor: theme.colors.border }]} />
    </View>
  );

  const canUseRealtime = !isNewConversation && !!actualConversationId;
  const typingChannelId = canUseRealtime ? actualConversationId : undefined;

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

      {isNewConversation && renderPendingBanner()}

      {messages.length === 0 && otherUser && renderContactInfo()}

      {messages.length > 0 && renderDateSeparator()}

      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messagesList}
        inverted={false}
        ListHeaderComponent={
          canUseRealtime && connectionStatus !== 'connected' ? (
            <ConnectionStatus
              status={connectionStatus}
              onRetry={() => {
                console.log('Retrying connection...');
              }}
            />
          ) : null
        }
        ListFooterComponent={
          canUseRealtime && typingUsers.length > 0 ? (
            <TypingIndicator isVisible multipleUsers={typingUsers} />
          ) : null
        }
      />
      <MessageInput
        onSend={handleSendMessage}
        onTyping={typingChannelId ? () => sendTyping(typingChannelId) : undefined}
        onStopTyping={typingChannelId ? () => sendStopTyping(typingChannelId) : undefined}
        placeholder={isNewConversation ? 'Tin nhắn sẽ được gửi dưới dạng yêu cầu' : 'Nhắn tin...'}
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
  pendingChip: {
    marginTop: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: '#FFA500',
  },
  pendingChipText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
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
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF9500',
  },
  pendingBannerText: {
    marginLeft: 12,
    flex: 1,
  },
  pendingBannerTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  pendingBannerSubtitle: {
    fontSize: 13,
    marginTop: 2,
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
