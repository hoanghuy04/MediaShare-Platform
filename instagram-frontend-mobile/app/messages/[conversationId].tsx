// app/messages/[conversationId].tsx (hoặc ConversationScreen.tsx)
import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Text,
  TouchableOpacity,
  ImageBackground,
  Modal,
  SafeAreaView,
  ActivityIndicator,
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
import { messageAPI, userAPI, messageRequestAPI, aiAPI } from '../../services/api';
import { Conversation, Message, UserProfile } from '../../types';
import { showAlert } from '../../utils/helpers';
import { MutualUserPicker, MutualUserOption } from '../../components/messages/MutualUserPicker';
import { GroupInfoSheet } from '../../components/messages/GroupInfoSheet';
import { ConversationHeader } from '../../components/messages/ConversationHeader';
import { ConversationMeta } from '../../components/messages/ConversationMeta';
import { AddMembersModal } from '../../components/messages/AddMembersModal';

const hexToRgba = (hex?: string, alpha = 1) => {
  if (!hex) return `rgba(0,0,0,${alpha})`;
  const s = hex.replace('#', '');
  if (s.length !== 6) return `rgba(0,0,0,${alpha})`;
  const n = parseInt(s, 16);
  const r = (n >> 16) & 255,
    g = (n >> 8) & 255,
    b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
};

export default function ConversationScreen() {
  const params = useLocalSearchParams<{
    conversationId?: string | string[];
    isNewConversation?: string | string[];
    requestId?: string | string[];
    direction?: string | string[];
    senderId?: string | string[];
    receiverId?: string | string[];
    textPrompt?: string | string[];
  }>();
  const normalizeParam = (v?: string | string[]) => (Array.isArray(v) ? v[0] : v);

  const routeConversationId = normalizeParam(params.conversationId) || '';
  const routePendingFlag = normalizeParam(params.isNewConversation);
  const routeRequestId = normalizeParam(params.requestId);
  const direction = normalizeParam(params.direction);
  const routeSenderId = normalizeParam(params.senderId);
  const routeReceiverId = normalizeParam(params.receiverId);
  const textPrompt = normalizeParam(params.textPrompt);
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
  const [conversationDetails, setConversationDetails] = useState<Conversation | null>(null);
  const [isGroupInfoVisible, setGroupInfoVisible] = useState(false);
  const [isAddMembersVisible, setAddMembersVisible] = useState(false);
  const [pendingMembers, setPendingMembers] = useState<Record<string, MutualUserOption>>({});
  const [isAddingMembers, setIsAddingMembers] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  const flatListRef = useRef<FlatList<Message>>(null);

  const isGroupConversation = conversationDetails?.type === 'GROUP';
  const participantMap = useMemo(() => {
    const map = new Map<string, Conversation['participants'][number]>();
    conversationDetails?.participants?.forEach(p => map.set(p.userId, p));
    return map;
  }, [conversationDetails]);

  const typingDisplayNames = useMemo(
    () => typingUsers.map(id => participantMap.get(id)?.username).filter(Boolean) as string[],
    [participantMap, typingUsers]
  );

  const recentMedia = useMemo(
    () => messages.filter(m => !!m.mediaUrl).slice(-6).reverse(),
    [messages]
  );

  const existingMemberIds = useMemo(
    () => conversationDetails?.participants?.map(m => m.userId) ?? [],
    [conversationDetails]
  );

  // Palette tổng hợp: ưu tiên themeColor của conversation
  const chatPalette = useMemo(() => {
    const accent = conversationDetails?.themeColor || theme.chat.bubbleOut;
    return {
      bubbleIn: theme.chat.bubbleIn,
      bubbleOut: accent,
      bubbleText: theme.chat.bubbleText,
      headerBg: conversationDetails?.themeColor ? hexToRgba(accent, 0.92) : theme.chat.headerBg,
      headerText: theme.chat.headerText,
      tint: conversationDetails?.themeColor || theme.chat.tint,
      fabBg: theme.chat.fabBg,
    };
  }, [conversationDetails?.themeColor, theme]);

  const bubblePalette = useMemo(
    () => ({ bubbleIn: chatPalette.bubbleIn, bubbleOut: chatPalette.bubbleOut, bubbleText: chatPalette.bubbleText }),
    [chatPalette]
  );

  const wallpaperOverlay = useMemo(() => hexToRgba(chatPalette.tint, 0.34), [chatPalette.tint]);

  // AI assistant detection
  const isAiAssistant = useMemo(
    () => (otherUser?.username || '').toLowerCase() === 'ai-assistant',
    [otherUser?.username]
  );

  const scrollToBottom = useCallback(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
    setShowScrollToBottom(false);
  }, []);

  const handleListScroll = useCallback(e => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const distance = contentSize.height - (contentOffset.y + layoutMeasurement.height);
    setShowScrollToBottom(distance > 280);
  }, []);

  // ------- data helpers -------
  const ensureMessageSender = useCallback(
    (m: Message): Message => {
      if ((m as any).sender?.id || !user) return m;
      return {
        ...m,
        sender: {
          id: user.id,
          username: user.username,
          avatar: user.profile?.avatar,
          isVerified: !!user.isVerified,
        },
      };
    },
    [user]
  );

  const sortAsc = useCallback(
    (list: Message[]) =>
      [...list].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      ),
    []
  );

  // ------- load pending/existing -------
  const loadPendingThread = useCallback(
    async (targetId: string) => {
      if (!targetId || !user?.id) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        setIsNewConversation(true);
        setActualConversationId(null);
        setPeerUserId(targetId);
        setConversationDetails(null);
        if (!otherUser || otherUser.id !== targetId) {
          const profile = await userAPI.getUserProfile(targetId);
          setOtherUser(profile);
        }
        let pendingMessages: Message[];
        if (routeRequestId) {
          pendingMessages = await messageRequestAPI.getPendingMessagesByRequestId(
            routeRequestId
          );
        } else {
          let senderId = routeSenderId,
            receiverId = routeReceiverId;
          if (!senderId || !receiverId) {
            if (direction === 'received') {
              senderId = targetId;
              receiverId = user.id;
            } else {
              senderId = user.id;
              receiverId = targetId;
            }
          }
          pendingMessages = await messageRequestAPI.getPendingMessages(senderId!, receiverId!);
        }
        setMessages(sortAsc(pendingMessages.map(ensureMessageSender)));
      } catch (e) {
        console.error('loadPendingThread', e);
        setMessages([]);
      } finally {
        setIsLoading(false);
      }
    },
    [direction, ensureMessageSender, otherUser, routeReceiverId, routeRequestId, routeSenderId, sortAsc, user]
  );

  const loadExistingThread = useCallback(
    async (convId: string) => {
      if (!convId) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const conversation = await messageAPI.getConversation(convId);
        setActualConversationId(conversation.id);
        setIsNewConversation(false);
        setConversationDetails(conversation);

        if (conversation.type === 'DIRECT' && conversation.participants?.length) {
          const other =
            conversation.participants.find(p => p.userId !== user?.id) ||
            conversation.participants[0];
          if (other) {
            setPeerUserId(other.userId);
            console.log("________________________OTHHER____________: ", other);
            
            setOtherUser(prev =>
              prev?.id === other.userId
                ? prev
                : {
                  id: other.userId,
                  username: other.username,
                  email: '',
                  profile: { avatar: other.avatar },
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  isVerified: other.isVerified,
                }
            );
          }
        } else {
          setPeerUserId(null);
          setOtherUser(null);
        }

        const res = await messageAPI.getMessages(conversation.id);
        const ordered = (res.content || []).map(ensureMessageSender);
        setMessages(sortAsc(ordered));

        if (res.content?.length) {
          const unread = res.content.filter(
            m => m.sender.id !== user?.id && !m.readBy.includes(user?.id || '')
          );
          if (unread.length) unread.forEach(m => sendReadReceipt(m.id, m.sender.id));
        }
      } catch (err: any) {
        if (err?.response?.status === 404) {
          await loadPendingThread(convId);
          return;
        }
        console.error('loadExistingThread', err);
        setMessages([]);
      } finally {
        setIsLoading(false);
      }
    },
    [ensureMessageSender, loadPendingThread, sendReadReceipt, sortAsc, user]
  );

  const transitionToConversation = useCallback(
    (nextId: string) => {
      if (!nextId) return;
      setIsNewConversation(false);
      setActualConversationId(nextId);
      router.replace({
        pathname: '/messages/[conversationId]',
        params: { conversationId: nextId },
      });
      loadExistingThread(nextId);
    },
    [loadExistingThread, router]
  );

  // ------- websocket -------
  useEffect(() => {
    const onMsg = (packet: any) => {
      const peerId = otherUser?.id || peerUserId || routeConversationId;
      const matchesPeer =
        peerId && (packet.senderId === peerId || packet.receiverId === peerId);
      const matchesConv =
        !!packet.conversationId &&
        !!actualConversationId &&
        packet.conversationId === actualConversationId;
      if (packet.type !== 'CHAT' || (!matchesPeer && !matchesConv)) return;
      if (!packet.senderId) return;

      const incoming: Message = {
        id: packet.id || '',
        sender: {
          id: packet.senderId,
          username: packet.senderUsername || '',
          avatar: packet.senderProfileImage,
          isVerified: false,
        },
        conversationId: packet.conversationId,
        content: packet.content || '',
        mediaUrl: packet.mediaUrl,
        readBy: packet.status === 'READ' ? [user?.id || ''] : [],
        createdAt: packet.timestamp,
        isDeleted: false,
      };

      setMessages(prev => {
        const exists = prev.some(m => m.id === incoming.id);
        if (exists) {
          console.log('🚫 Duplicate message blocked:', incoming.id);
          return prev;
        }

        if (packet.senderId === user?.id) {
          const hasOptimistic = prev.some(m => m.id.startsWith('temp-'));
          if (hasOptimistic) {
            const replaced = prev.map(m =>
              m.id.startsWith('temp-') && m.content === incoming.content ? incoming : m
            );
            return sortAsc(replaced);
          }
        }

        console.log('✅ Adding message:', incoming.id);
        return sortAsc([...prev, incoming]);
      });

      if (isNewConversation && packet.conversationId)
        transitionToConversation(packet.conversationId);

      const peer = otherUser?.id || peerUserId || routeConversationId;
      if (
        !isNewConversation &&
        peer &&
        packet.senderId === peer &&
        packet.id &&
        packet.senderId !== user?.id
      ) {
        sendReadReceipt(packet.id, packet.senderId);
      }
    };

    const onRr = (messageId: string, senderId: string) => {
      const peer = otherUser?.id || peerUserId || routeConversationId;
      if (!peer || senderId !== peer) return;
      setMessages(prev =>
        prev.map(m =>
          m.id === messageId ? { ...m, readBy: [...m.readBy, senderId] } : m
        )
      );
    };

    const onTp = (isTyping: boolean, uid: string) => {
      const peer = otherUser?.id || peerUserId || routeConversationId;
      if (!peer || uid !== peer) return;
      setTypingUsers(prev =>
        isTyping ? (prev.includes(uid) ? prev : [...prev, uid]) : prev.filter(id => id !== uid)
      );
    };

    onMessage(onMsg);
    onReadReceipt(onRr);
    onTyping(onTp);
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
    if (wantsPendingRoute) loadPendingThread(routeConversationId);
    else loadExistingThread(routeConversationId);
  }, [routeConversationId, wantsPendingRoute, loadExistingThread, loadPendingThread]);

  // Auto-send textPrompt to AI nếu mở từ search
  useEffect(() => {
    if (!textPrompt) return;
    if (!isAiAssistant) return;
    if (isLoading) return;

    const initial = String(textPrompt || '').trim();
    if (!initial) return;

    sendToAI(initial);
    router.replace({
      pathname: '/messages/[conversationId]',
      params: { conversationId: actualConversationId || routeConversationId },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textPrompt, isAiAssistant, isLoading]);

  // ------- send to AI (dùng chung: direct với AI hoặc @ai-assistant trong group/direct khác) -------
  const sendToAI = useCallback(
    async (content: string) => {
      // 1. Optimistic message của user
      const optimisticUser: Message = {
        id: `temp-${Date.now()}-u`,
        sender: {
          id: user?.id || '',
          username: user?.username || '',
          avatar: user?.profile?.avatar,
          isVerified: !!user?.isVerified,
        },
        content,
        readBy: [],
        createdAt: new Date().toISOString(),
        isDeleted: false,
      };

      setMessages(prev => sortAsc([...prev, optimisticUser]));

      try {
        // 2. Gọi AI API - dùng đúng kiểu return mà bạn đưa:
        // sendPrompt: Promise<{ message: Message; conversationId: string }>
        const { message: aiMsg, conversationId: nextConvId } = await aiAPI.sendPrompt(
          content,
          actualConversationId ? { conversationId: actualConversationId } : undefined
        );

        // 3. Nếu đang chưa có conversationId (VD: mở AI lần đầu) → chuyển sang conv đó
        if (!actualConversationId && nextConvId) {
          transitionToConversation(nextConvId);
        }

        // 4. Fallback: push message AI vào state nếu WS không bắn về
        setMessages(prev => {
          // chặn duplicate nếu WS đã gửi rồi
          if (prev.some(m => m.id === aiMsg.id)) return prev;

          // đảm bảo có đủ field như Message FE
          const normalized: Message = ensureMessageSender({
            ...aiMsg,
            conversationId: aiMsg.conversationId || nextConvId || actualConversationId || '',
          } as Message);

          return sortAsc([...prev, normalized]);
        });
      } catch (e: any) {
        // rollback optimistic nếu lỗi
        setMessages(prev => prev.filter(m => m.id !== optimisticUser.id));
        showAlert('Lỗi', e?.message || 'Gửi yêu cầu AI thất bại');
      }
    },
    [
      actualConversationId,
      sortAsc,
      transitionToConversation,
      ensureMessageSender,
      user?.id,
      user?.profile?.avatar,
      user?.username,
      user?.isVerified,
    ]
  );


  // ------- send message thường -------
  const handleSendMessage = async (content: string) => {
    if (isAiAssistant) {
      await sendToAI(content);
      return;
    }

    const targetUserId = otherUser?.id || peerUserId || routeConversationId;
    if (!targetUserId) {
      showAlert('Error', 'Unable to determine recipient.');
      return;
    }

    try {
      const optimistic: Message = {
        id: `temp-${Date.now()}`,
        sender: {
          id: user?.id || '',
          username: user?.username || '',
          avatar: user?.profile?.avatar,
          isVerified: !!user?.isVerified,
        },
        content,
        readBy: [],
        createdAt: new Date().toISOString(),
        isDeleted: false,
      };
      setMessages(prev => sortAsc([...prev, optimistic]));

      if (isNewConversation) {
        const newMsg = await messageAPI.sendDirectMessage(targetUserId, content);
        if (!newMsg.sender) return;
        setMessages(prev =>
          sortAsc(
            prev.map(m => (m.id === optimistic.id ? ensureMessageSender(newMsg) : m))
          )
        );
        if (newMsg.conversationId) transitionToConversation(newMsg.conversationId);
      } else {
        if (isConnected && peerUserId) {
          sendWebSocketMessage(peerUserId, content);
        } else {
          if (!actualConversationId) {
            setMessages(prev => prev.filter(m => m.id !== optimistic.id));
            showAlert('Error', 'Conversation is still syncing. Please try again.');
            return;
          }
          const newMsg = await messageAPI.sendMessage(actualConversationId, content);
          if (!newMsg.sender) return;
          setMessages(prev =>
            sortAsc(
              prev.map(m => (m.id === optimistic.id ? ensureMessageSender(newMsg) : m))
            )
          );
        }
      }
    } catch (e: any) {
      setMessages(prev => prev.filter(m => !m.id.startsWith('temp-')));
      showAlert('Error', e?.message || 'Failed to send message');
    }
  };

  // ------- cluster flags -------
  const CLUSTER_MS = 2 * 60 * 1000;
  const getClusterFlags = useCallback(
    (index: number) => {
      const cur = messages[index],
        prev = messages[index - 1],
        next = messages[index + 1];
      const samePrev =
        !!prev &&
        prev.sender?.id === cur?.sender?.id &&
        new Date(cur.createdAt).getTime() -
        new Date(prev.createdAt).getTime() <=
        CLUSTER_MS;
      const sameNext =
        !!next &&
        next.sender?.id === cur?.sender?.id &&
        new Date(next.createdAt).getTime() -
        new Date(cur.createdAt).getTime() <=
        CLUSTER_MS;
      return {
        isClusterStart: !samePrev,
        isClusterEnd: !sameNext,
        isClusterMiddle: samePrev && sameNext,
      };
    },
    [messages]
  );

  const handleScrollToMessage = useCallback(
    (id: string) => {
      const idx = messages.findIndex(m => m.id === id);
      if (idx >= 0)
        flatListRef.current?.scrollToIndex({
          index: idx,
          animated: true,
          viewPosition: 0.5,
        });
    },
    [messages]
  );

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    if (!item.sender) {
      return (
        <View style={styles.systemMessageContainer}>
          <Text style={[styles.systemMessageText, { color: theme.colors.textSecondary }]}>
            {item.content}
          </Text>
        </View>
      );
    }
    const isOwn = item.sender.id === user?.id;
    const { isClusterStart, isClusterEnd, isClusterMiddle } = getClusterFlags(index);
    const showAvatar = !isOwn && isClusterEnd;
    const hasPeerSeen = isOwn && peerUserId && item.readBy?.some(id => id === peerUserId);

    return (
      <View>
        <ChatMessage
          message={item}
          isOwn={isOwn}
          isClusterStart={isClusterStart}
          isClusterMiddle={isClusterMiddle}
          isClusterEnd={isClusterEnd}
          showAvatar={showAvatar}
          avatarUrl={item.sender.avatar}
          replyTo={item.replyTo}
          onPressReply={handleScrollToMessage}
          palette={bubblePalette}
        />
        {hasPeerSeen && (
          <Text style={[styles.readReceiptLabel, { color: theme.colors.textSecondary }]}>
            Đã xem
          </Text>
        )}
      </View>
    );
  };

  const title = isGroupConversation
    ? conversationDetails?.name || 'Nhóm chat'
    : otherUser?.username || conversationDetails?.name || 'Cuộc trò chuyện';
  const subtitle = isGroupConversation
    ? `${conversationDetails?.participants?.length || 0} thành viên`
    : connectionStatus === 'connected'
      ? 'Đang hoạt động'
      : 'Ngoại tuyến';
  const avatarSrc = isGroupConversation
    ? conversationDetails?.avatar
    : otherUser?.profile?.avatar;

    console.log("__________________________________avatarSrc__________________________: ", avatarSrc);
    

  const canUseRealtime = !isNewConversation && !!actualConversationId;
  const typingChannelId = canUseRealtime ? actualConversationId : undefined;

  const messageList = (
    <FlatList
      ref={flatListRef}
      data={messages}
      renderItem={renderMessage}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.messagesList}
      keyboardShouldPersistTaps="handled"
      onScroll={handleListScroll}
      scrollEventThrottle={16}
      ListHeaderComponent={
        canUseRealtime && connectionStatus !== 'connected' ? (
          <ConnectionStatus status={connectionStatus} onRetry={() => { }} />
        ) : null
      }
      ListFooterComponent={<View style={styles.listFooter} />}
    />
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ConversationHeader
          headerBg={hexToRgba(chatPalette.headerBg, 0.92)}
          headerTextColor={chatPalette.headerText}
          title={title}
          subtitle={subtitle}
          avatarSrc={avatarSrc}
          isGroupConversation={isGroupConversation}
          connectionStatus={connectionStatus}
          onBack={() => router.back()}
          onOpenSettings={() => {
            const isGroup = conversationDetails?.type === 'GROUP';
            if (isGroup) {
              router.push({
                pathname: '/messages/conversation-settings',
                params: { conversationId: actualConversationId || routeConversationId || '' },
              });
            } else {
              router.push({
                pathname: '/messages/conversation-settings',
                params: { userId: otherUser?.id || peerUserId || '' },
              });
            }
          }}
          onOpenInfo={() => setGroupInfoVisible(true)}
        />
        <LoadingSpinner />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ConversationHeader
        headerBg={hexToRgba(chatPalette.headerBg, 0.92)}
        headerTextColor={chatPalette.headerText}
        title={title}
        subtitle={subtitle}
        avatarSrc={avatarSrc}
        isGroupConversation={isGroupConversation}
        connectionStatus={connectionStatus}
        onBack={() => router.back()}
        onOpenSettings={() => {
          const isGroup = conversationDetails?.type === 'GROUP';
          if (isGroup) {
            router.push({
              pathname: '/messages/conversation-settings',
              params: { conversationId: actualConversationId || routeConversationId || '' },
            });
          } else {
            router.push({
              pathname: '/messages/conversation-settings',
              params: { userId: otherUser?.id || peerUserId || '' },
            });
          }
        }}
        onOpenInfo={() => setGroupInfoVisible(true)}
      />

      <ConversationMeta
        wantsPendingRoute={wantsPendingRoute}
        messages={messages}
        otherUser={otherUser}
        isGroupConversation={isGroupConversation}
        recentMedia={recentMedia}
        theme={theme}
      />

      <View style={styles.messagesWrapper}>
        {conversationDetails?.wallpaperUrl ? (
          <ImageBackground
            source={{ uri: conversationDetails.wallpaperUrl }}
            style={styles.wallpaperBackground}
            blurRadius={0}
          >
            <View
              style={[styles.wallpaperOverlay, { backgroundColor: wallpaperOverlay }]}
            />
            {messageList}
          </ImageBackground>
        ) : (
          messageList
        )}

        {showScrollToBottom && (
          <TouchableOpacity
            style={[styles.scrollFab, { backgroundColor: chatPalette.fabBg }]}
            onPress={scrollToBottom}
          >
            <Ionicons name="chevron-down" size={22} color={theme.colors.text} />
          </TouchableOpacity>
        )}
      </View>

      {typingDisplayNames.length > 0 && (
        <View style={styles.typingDock}>
          <TypingIndicator isVisible multipleUsers={typingDisplayNames} />
        </View>
      )}

      <MessageInput
        onSend={handleSendMessage}
        onSendToAI={sendToAI}          
        onTyping={typingChannelId ? () => sendTyping(typingChannelId) : undefined}
        onStopTyping={typingChannelId ? () => sendStopTyping(typingChannelId) : undefined}
        placeholder="Nhắn tin..."
        themeColor={chatPalette.bubbleOut}
      />


      <GroupInfoSheet
        visible={isGroupInfoVisible}
        conversation={conversationDetails || undefined}
        currentUserId={user?.id || ''}
        onClose={() => setGroupInfoVisible(false)}
        onAddMembers={() => {
          setPendingMembers({});
          setAddMembersVisible(true);
          setGroupInfoVisible(false);
        }}
        onLeaveGroup={async () => {
          if (!actualConversationId || !user?.id) return;
          try {
            await messageAPI.leaveGroup(actualConversationId, user.id);
            showAlert('Thông báo', 'Bạn đã rời nhóm');
            router.replace('/messages');
          } catch (e: any) {
            showAlert('Lỗi', e?.response?.data?.message || 'Không thể rời nhóm');
          }
        }}
      />

      <AddMembersModal
        visible={isAddMembersVisible}
        theme={theme}
        pendingMembers={pendingMembers}
        setPendingMembers={setPendingMembers}
        existingMemberIds={existingMemberIds}
        isAddingMembers={isAddingMembers}
        onClose={() => setAddMembersVisible(false)}
        onConfirm={async userIds => {
          if (!actualConversationId || !user?.id) return;
          if (!userIds.length) {
            showAlert('Thông báo', 'Vui lòng chọn ít nhất một thành viên');
            return;
          }
          try {
            setIsAddingMembers(true);
            await messageAPI.addGroupMembers(actualConversationId, user.id, userIds);
            showAlert('Thành công', 'Đã thêm thành viên mới');
            setAddMembersVisible(false);
            setPendingMembers({});
            await loadExistingThread(actualConversationId);
          } catch (e: any) {
            showAlert('Lỗi', e?.response?.data?.message || 'Không thể thêm thành viên');
          } finally {
            setIsAddingMembers(false);
          }
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  messagesWrapper: { flex: 1, position: 'relative' },
  wallpaperBackground: { flex: 1 },
  wallpaperOverlay: { ...StyleSheet.absoluteFillObject },
  messagesList: {
    paddingRight: 6,
    paddingLeft: 36,
    paddingTop: 8,
    paddingBottom: 64,
  },
  listFooter: { height: 40 },
  scrollFab: {
    position: 'absolute',
    right: 16,
    bottom: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.18,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 6 },
    }),
  },
  typingDock: { paddingHorizontal: 16, paddingVertical: 4 },
  readReceiptLabel: {
    fontSize: 11,
    marginTop: 2,
    textAlign: 'right',
  },
  systemMessageContainer: {
    alignItems: 'center',
    marginVertical: 6,
    paddingHorizontal: 16,
  },
  systemMessageText: { fontSize: 12, textAlign: 'center' },
});
