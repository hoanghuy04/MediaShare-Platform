import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Text,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { useWebSocket } from '../../context/WebSocketContext';
import { useConversation } from '../../context/ConversationContext';
import { MessageType } from '../../types/enum.type';
import { fileService } from '../../services/file.service';
import { ChatMessage } from '../../components/messages/ChatMessage';
import { MessageInput } from '../../components/messages/MessageInput';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { MessageList } from '../../components/messages/MessageList';
import { WallpaperWrapper } from '../../components/messages/WallpaperWrapper';
import { ScrollToBottomButton } from '../../components/messages/ScrollToBottomButton';
import { TypingDock } from '../../components/messages/TypingDock';
import { ReadReceiptLabel } from '../../components/messages/ReadReceiptLabel';
import { userAPI } from '../../services/api';
import { messageRequestAPI } from '../../services/message-request.service';
import { aiAPI } from '../../services/ai.service';
import { messageAPI } from '../../services/message.service';
import { Conversation, Message, UserProfile } from '../../types';
import { showAlert } from '../../utils/helpers';
import {
  MutualUserPicker,
  MutualUserOption,
} from '../../components/messages/MutualUserPicker';
import { GroupInfoSheet } from '../../components/messages/GroupInfoSheet';
import { ConversationHeader } from '../../components/messages/ConversationHeader';
import { ConversationMeta } from '../../components/messages/ConversationMeta';
import { AddMembersModal } from '../../components/messages/AddMembersModal';

const hexToRgba = (hex?: string, alpha = 1) => {
  if (!hex) return `rgba(0,0,0,${alpha})`;
  const s = hex.replace('#', '');
  if (s.length !== 6) return `rgba(0,0,0,${alpha})`;
  const n = parseInt(s, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
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

  const normalizeParam = (v?: string | string[]) =>
    Array.isArray(v) ? v[0] : v;

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
  const [actualConversationId, setActualConversationId] =
    useState<string | null>(wantsPendingRoute ? null : routeConversationId);
  const [isNewConversation, setIsNewConversation] =
    useState(wantsPendingRoute);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isGroupInfoVisible, setGroupInfoVisible] = useState(false);
  const [isAddMembersVisible, setAddMembersVisible] = useState(false);

  // ConversationContext
  const {
    conversation: conversationDetails,
  } = useConversation(actualConversationId || routeConversationId);
  const [pendingMembers, setPendingMembers] = useState<
    Record<string, MutualUserOption>
  >({});
  const [isAddingMembers, setIsAddingMembers] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const flatListRef = useRef<FlatList<Message>>(null);

  const isGroupConversation = conversationDetails?.type === 'GROUP';

  const participantMap = useMemo(() => {
    const map = new Map<string, Conversation['participants'][number]>();
    conversationDetails?.participants?.forEach(p =>
      map.set(p.userId, p)
    );
    return map;
  }, [conversationDetails]);

  const typingDisplayNames = useMemo(
    () =>
      typingUsers
        .map(id => participantMap.get(id)?.username)
        .filter(Boolean) as string[],
    [participantMap, typingUsers]
  );

  const existingMemberIds = useMemo(
    () => conversationDetails?.participants?.map(m => m.userId) ?? [],
    [conversationDetails]
  );

  // Palette
  const chatPalette = useMemo(() => {
    const accent = conversationDetails?.themeColor || theme.chat.bubbleOut;
    return {
      bubbleIn: theme.chat.bubbleIn,
      bubbleOut: accent,
      bubbleTextIn: theme.chat.bubbleTextIn,
      bubbleTextOut: theme.chat.bubbleTextOut,
      headerBg: conversationDetails?.themeColor
        ? hexToRgba(accent, 0.92)
        : theme.chat.headerBg,
      headerText: theme.chat.headerText,
      tint: conversationDetails?.themeColor || theme.chat.tint,
      fabBg: theme.chat.fabBg,
    };
  }, [conversationDetails?.themeColor, theme]);

  const bubblePalette = useMemo(
    () => ({
      bubbleIn: chatPalette.bubbleIn,
      bubbleOut: chatPalette.bubbleOut,
      bubbleTextIn: chatPalette.bubbleTextIn,
      bubbleTextOut: chatPalette.bubbleTextOut,
    }),
    [chatPalette]
  );

  const wallpaperOverlay = useMemo(
    () => hexToRgba(chatPalette.tint, 0.34),
    [chatPalette.tint]
  );

  // AI assistant detection
  const isAiAssistant = useMemo(
    () => (otherUser?.username || '').toLowerCase() === 'ai-assistant',
    [otherUser?.username]
  );

  const scrollToBottom = useCallback(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, []);

  const handleListScroll = useCallback(e => {
    const { contentOffset, contentSize, layoutMeasurement } =
      e.nativeEvent;
    const distance =
      contentSize.height -
      (contentOffset.y + layoutMeasurement.height);
    setShowScrollToBottom(distance > 280);
  }, []);

  // Helpers
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
        (a, b) =>
          new Date(a.createdAt).getTime() -
          new Date(b.createdAt).getTime()
      ),
    []
  );

  // Load pending
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
        if (!otherUser || otherUser.id !== targetId) {
          const profile = await userAPI.getUserProfile(targetId);
          setOtherUser(profile);
        }
        let pendingMessages: Message[];
        if (routeRequestId) {
          pendingMessages =
            await messageRequestAPI.getPendingMessagesByRequestId(
              routeRequestId
            );
        } else {
          let senderId = routeSenderId;
          let receiverId = routeReceiverId;
          if (!senderId || !receiverId) {
            if (direction === 'received') {
              senderId = targetId;
              receiverId = user.id;
            } else {
              senderId = user.id;
              receiverId = targetId;
            }
          }
          pendingMessages =
            await messageRequestAPI.getPendingMessages(
              senderId!,
              receiverId!
            );
        }
        setMessages(
          sortAsc(pendingMessages.map(ensureMessageSender))
        );
      } catch (e) {
        console.error('loadPendingThread', e);
        setMessages([]);
      } finally {
        setIsLoading(false);
      }
    },
    [
      direction,
      ensureMessageSender,
      otherUser,
      routeReceiverId,
      routeRequestId,
      routeSenderId,
      sortAsc,
      user,
    ]
  );

  // Load existing
  const loadExistingThread = useCallback(
    async (convId: string) => {
      if (!convId) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        setActualConversationId(convId);
        setIsNewConversation(false);

        const res = await messageAPI.getMessages(
          convId,
          0,
          20
        );
        const ordered = (res.content || []).map(
          ensureMessageSender
        );
        setMessages(sortAsc(ordered));

        setCurrentPage(0);
        setHasMoreMessages(!res.last);

        if (res.content?.length) {
          const unread = res.content.filter(
            m =>
              m.sender.id !== user?.id &&
              !m.readBy.includes(user?.id || '')
          );
          if (unread.length)
            unread.forEach(m =>
              sendReadReceipt(m.id, m.sender.id)
            );
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
    [
      ensureMessageSender,
      loadPendingThread,
      sendReadReceipt,
      sortAsc,
      user,
    ]
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

  // Load more (pull up)
  const loadMoreMessages = useCallback(async () => {
    if (
      !actualConversationId ||
      isLoadingMore ||
      !hasMoreMessages ||
      isNewConversation
    ) {
      return;
    }

    setIsLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const res = await messageAPI.getMessages(
        actualConversationId,
        nextPage,
        20
      );

      if (res.content && res.content.length > 0) {
        const newMessages = res.content.map(ensureMessageSender);
        setMessages(prev => sortAsc([...newMessages, ...prev]));
        setCurrentPage(nextPage);
        setHasMoreMessages(!res.last);
      } else {
        setHasMoreMessages(false);
      }
    } catch (error) {
      console.error('Error loading more messages:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [
    actualConversationId,
    currentPage,
    hasMoreMessages,
    isLoadingMore,
    isNewConversation,
    ensureMessageSender,
    sortAsc,
  ]);

  // WebSocket events (đã xử lý cho group)
  useEffect(() => {
    // CHAT packet
    const onMsg = (packet: any) => {
      if (packet.type !== 'CHAT') return;
      if (!packet.senderId) return;

      const matchesConv =
        !!packet.conversationId &&
        !!actualConversationId &&
        packet.conversationId === actualConversationId;

      const peerId = otherUser?.id || peerUserId || routeConversationId;
      const matchesPeer =
        !matchesConv &&
        !isGroupConversation &&
        peerId &&
        (packet.senderId === peerId || packet.receiverId === peerId);

      if (!matchesConv && !matchesPeer) {
        return;
      }

      const incoming: Message = {
        id: packet.id || '',
        sender: {
          id: packet.senderId,
          username: packet.senderUsername || '',
          avatar: packet.senderProfileImage,
          isVerified: false,
        },
        conversationId: packet.conversationId || actualConversationId || undefined,
        content: packet.content || '',
        type: packet.contentType || MessageType.TEXT,
        readBy: packet.status === 'READ' ? [user?.id || ''] : [],
        createdAt: packet.timestamp,
        isDeleted: false,
      };

      setMessages(prev => {
        const exists = prev.some(m => m.id === incoming.id);
        if (exists) return prev;

        if (packet.senderId === user?.id) {
          const hasOptimistic = prev.some(m => m.id.startsWith('temp-'));
          if (hasOptimistic) {
            const replaced = prev.map(m =>
              m.id.startsWith('temp-') && m.content === incoming.content
                ? incoming
                : m
            );
            return sortAsc(replaced);
          }
        }

        return sortAsc([...prev, incoming]);
      });

      if (
        !isNewConversation &&
        packet.conversationId === actualConversationId &&
        packet.senderId !== user?.id &&
        packet.id
      ) {
        sendReadReceipt(packet.id, packet.senderId);
      }
    };

    const onRr = (messageId: string, readerId: string, convId?: string) => {
      if (actualConversationId && convId && convId !== actualConversationId) {
        return;
      }

      setMessages(prev =>
        prev.map(m =>
          m.id === messageId
            ? m.readBy?.includes(readerId)
              ? m
              : { ...m, readBy: [...(m.readBy || []), readerId] }
            : m
        )
      );
    };

    const onTp = (isTypingFlag: boolean, uid: string, convId?: string) => {
      if (!uid || uid === user?.id) return;

      if (actualConversationId && convId && convId !== actualConversationId) {
        return;
      }

      if (!isGroupConversation && !convId) {
        const peer = otherUser?.id || peerUserId || routeConversationId;
        if (!peer || uid !== peer) {
          return;
        }
      }

      setTypingUsers(prev =>
        isTypingFlag
          ? prev.includes(uid)
            ? prev
            : [...prev, uid]
          : prev.filter(id => id !== uid)
      );
    };

    const offMessage = onMessage(onMsg);
    const offReadReceipt = onReadReceipt(onRr as any);
    const offTyping = onTyping(onTp as any);

    return () => {
      offMessage();
      offReadReceipt();
      offTyping();
    };
  }, [
    actualConversationId,
    isNewConversation,
    isGroupConversation,
    onMessage,
    onReadReceipt,
    onTyping,
    otherUser,
    peerUserId,
    routeConversationId,
    sendReadReceipt,
    sortAsc,
    transitionToConversation,
    user?.id,
  ]);


  useEffect(() => {
    if (!conversationDetails) return;

    if (
      conversationDetails.type === 'DIRECT' &&
      conversationDetails.participants?.length
    ) {
      const other =
        conversationDetails.participants.find(
          p => p.userId !== user?.id
        ) || conversationDetails.participants[0];
      if (other) {
        setPeerUserId(other.userId);
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
  }, [conversationDetails, user?.id]);

  // Initial load
  useEffect(() => {
    if (!routeConversationId) {
      setIsLoading(false);
      return;
    }
    if (wantsPendingRoute)
      loadPendingThread(routeConversationId);
    else loadExistingThread(routeConversationId);
  }, [
    routeConversationId,
    wantsPendingRoute,
    loadExistingThread,
    loadPendingThread,
  ]);

  useEffect(() => {
    if (!textPrompt) return;
    if (!isAiAssistant) return;
    if (isLoading) return;

    const initial = String(textPrompt || '').trim();
    if (!initial) return;

    sendToAI(initial);
    router.replace({
      pathname: '/messages/[conversationId]',
      params: {
        conversationId: actualConversationId || routeConversationId,
      },
    });
  }, [textPrompt, isAiAssistant, isLoading]);

  const sendToAI = useCallback(
    async (content: string) => {
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
        const {
          message: aiMsg,
          conversationId: nextConvId,
        } = await aiAPI.sendPrompt(
          content,
          actualConversationId
            ? { conversationId: actualConversationId }
            : undefined
        );

        if (!actualConversationId && nextConvId) {
          transitionToConversation(nextConvId);
        }

        setMessages(prev => {
          if (prev.some(m => m.id === aiMsg.id)) return prev;

          const normalized: Message = ensureMessageSender({
            ...aiMsg,
            conversationId:
              aiMsg.conversationId ||
              nextConvId ||
              actualConversationId ||
              '',
          } as Message);

          return sortAsc([...prev, normalized]);
        });
      } catch (e: any) {
        setMessages(prev =>
          prev.filter(m => m.id !== optimisticUser.id)
        );
        showAlert(
          'Lỗi',
          e?.message || 'Gửi yêu cầu AI thất bại'
        );
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

  // Gửi message thường (TEXT)
  const handleSendMessage = async (content: string) => {
    if (isAiAssistant) {
      await sendToAI(content);
      return;
    }

    const targetUserId =
      otherUser?.id || peerUserId || routeConversationId;
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
        type: MessageType.TEXT,
        readBy: [],
        createdAt: new Date().toISOString(),
        isDeleted: false,
      };
      setMessages(prev => sortAsc([...prev, optimistic]));

      if (isNewConversation) {
        const newMsg = await messageAPI.sendDirectMessage(
          targetUserId,
          content,
          MessageType.TEXT
        );
        if (!newMsg.sender) return;
        setMessages(prev =>
          sortAsc(
            prev.map(m =>
              m.id === optimistic.id
                ? ensureMessageSender(newMsg)
                : m
            )
          )
        );
        if (newMsg.conversationId)
          transitionToConversation(newMsg.conversationId);
      } else {
        if (isConnected && peerUserId && !isGroupConversation) {
          // direct + websocket
          sendWebSocketMessage(peerUserId, content);
        } else {
          if (!actualConversationId) {
            setMessages(prev =>
              prev.filter(m => m.id !== optimistic.id)
            );
            showAlert(
              'Error',
              'Conversation is still syncing. Please try again.'
            );
            return;
          }
          // group hoặc fallback HTTP
          const newMsg = await messageAPI.sendMessage(
            actualConversationId,
            content,
            MessageType.TEXT
          );
          if (!newMsg.sender) return;
          setMessages(prev =>
            sortAsc(
              prev.map(m =>
                m.id === optimistic.id
                  ? ensureMessageSender(newMsg)
                  : m
              )
            )
          );
        }
      }
    } catch (e: any) {
      setMessages(prev =>
        prev.filter(m => !m.id.startsWith('temp-'))
      );
      showAlert('Error', e?.message || 'Failed to send message');
    }
  };

  const handleSendMedia = async (type: MessageType, localUri: string) => {
    const targetUserId =
      otherUser?.id || peerUserId || routeConversationId;
    if (!targetUserId) {
      showAlert('Error', 'Unable to determine recipient.');
      return;
    }

    const optimisticId = `temp-media-${Date.now()}`;
    const optimistic: Message = {
      id: optimisticId,
      sender: {
        id: user?.id || '',
        username: user?.username || '',
        avatar: user?.profile?.avatar,
        isVerified: !!user?.isVerified,
      },
      content: localUri,
      type,
      readBy: [],
      createdAt: new Date().toISOString(),
      isDeleted: false,
    };

    setMessages(prev => sortAsc([...prev, optimistic]));

    try {
      const formData = new FormData();
      const filename = localUri.split('/').pop() || 'media';
      const match = /\.(\w+)$/.exec(filename);
      const fileType = match
        ? `${type.toLowerCase()}/${match[1]}`
        : `${type.toLowerCase()}/jpeg`;

      formData.append('file', {
        uri: localUri,
        name: filename,
        type: fileType,
      } as any);

      const uploadResponse = await fileService.uploadFile(
        formData,
        'POST'
      );

      const mediaFileId = uploadResponse.id;

      let sentMessage: Message;
      if (isNewConversation) {
        sentMessage = await messageAPI.sendDirectMessage(
          targetUserId,
          mediaFileId,
          type
        );
        if (sentMessage.conversationId) {
          transitionToConversation(sentMessage.conversationId);
        }
      } else {
        if (!actualConversationId) {
          setMessages(prev =>
            prev.filter(m => m.id !== optimisticId)
          );
          showAlert(
            'Error',
            'Conversation is still syncing. Please try again.'
          );
          return;
        }
        sentMessage = await messageAPI.sendMessage(
          actualConversationId,
          mediaFileId,
          type
        );
      }

      setMessages(prev =>
        sortAsc(
          prev.map(m =>
            m.id === optimisticId
              ? ensureMessageSender(sentMessage)
              : m
          )
        )
      );
    } catch (e: any) {
      setMessages(prev =>
        prev.filter(m => m.id !== optimisticId)
      );
      showAlert(
        'Lỗi',
        e?.message || 'Không thể gửi media. Vui lòng thử lại.'
      );
    }
  };

  const CLUSTER_MS = 2 * 60 * 1000;
  const getClusterFlags = useCallback(
    (index: number) => {
      const cur = messages[index];
      const prev = messages[index - 1];
      const next = messages[index + 1];

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

  const handleHeaderAddMembers = useCallback(() => {
    if (isGroupConversation) {
      setPendingMembers({});
      setAddMembersVisible(true);
      return;
    }

    const seedUserId = otherUser?.id || peerUserId || undefined;

    if (seedUserId) {
      router.push({
        pathname: '/messages/create-group',
        params: { seedUserId },
      });
    } else {
      // fallback: mở màn create-group trống
      router.push({
        pathname: '/messages/create-group',
      });
    }
  }, [isGroupConversation, otherUser?.id, peerUserId, router]);


  const renderMessage = ({
    item,
    index,
  }: {
    item: Message;
    index: number;
  }) => {
    if (!item.sender) {
      return (
        <View style={styles.systemMessageContainer}>
          <Text
            style={[
              styles.systemMessageText,
              { color: theme.colors.textSecondary },
            ]}
          >
            {item.content}
          </Text>
        </View>
      );
    }
    const isOwn = item.sender.id === user?.id;
    const { isClusterStart, isClusterEnd, isClusterMiddle } =
      getClusterFlags(index);
    const showAvatar = !isOwn && isClusterEnd;
    const hasPeerSeen =
      !isGroupConversation &&
      isOwn &&
      peerUserId &&
      item.readBy?.some(id => id === peerUserId);

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
        <ReadReceiptLabel visible={hasPeerSeen} />
      </View>
    );
  };

  const title = useMemo(() => {
    if (isGroupConversation) {
      if (conversationDetails?.name) {
        return conversationDetails.name;
      }
      const members = conversationDetails?.participants || [];
      if (members.length <= 2) {
        return members.map(m => m.username).join(', ');
      }
      return (
        members
          .slice(0, 2)
          .map(m => m.username)
          .join(', ') + '...'
      );
    }
    return (
      otherUser?.profile?.firstName ||
      otherUser?.username ||
      conversationDetails?.name ||
      'Cuộc trò chuyện'
    );
  }, [isGroupConversation, conversationDetails, otherUser]);

  const subtitle = useMemo(() => {
    if (isGroupConversation) {
      return `${conversationDetails?.participants?.length || 0} thành viên`;
    }
    const handle = otherUser?.username;
    if (handle) return `@${handle}`;
    return '';
  }, [isGroupConversation, conversationDetails, otherUser]);

  const avatarSrc = isGroupConversation
    ? conversationDetails?.avatar
    : otherUser?.profile?.avatar;

  const canUseRealtime = !isNewConversation && !!actualConversationId;
  const typingChannelId = canUseRealtime
    ? actualConversationId
    : undefined;

  const messageList = (
    <MessageList
      messages={messages}
      renderMessage={renderMessage}
      onEndReached={loadMoreMessages}
      onScroll={handleListScroll}
      isLoadingMore={isLoadingMore}
      canUseRealtime={canUseRealtime}
      connectionStatus={connectionStatus}
      theme={theme}
      flatListRef={flatListRef}
    />
  );

  if (isLoading) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: theme.colors.background },
        ]}
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
                params: {
                  conversationId:
                    actualConversationId || routeConversationId || '',
                },
              });
            } else {
              router.push({
                pathname: '/messages/conversation-settings',
                params: { userId: otherUser?.id || peerUserId || '' },
              });
            }
          }}
          onOpenInfo={() => setGroupInfoVisible(true)}
          onAddMembers={handleHeaderAddMembers}
        />
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
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
                params: {
                  conversationId:
                    actualConversationId || routeConversationId || '',
                },
              });
            } else {
              router.push({
                pathname: '/messages/conversation-settings',
                params: { userId: otherUser?.id || peerUserId || '' },
              });
            }
          }}
          onOpenInfo={() => setGroupInfoVisible(true)}
          onAddMembers={handleHeaderAddMembers}
        />

        <ConversationMeta
          wantsPendingRoute={wantsPendingRoute}
          messages={messages}
          otherUser={otherUser}
          isGroupConversation={isGroupConversation}
          theme={theme}
          conversationDetails={conversationDetails}
          onOpenSettings={() => {
            if (isGroupConversation && actualConversationId) {
              router.push({
                pathname: '/messages/conversation-settings',
                params: { conversationId: actualConversationId },
              });
            }
          }}
        />

        <View style={styles.messagesWrapper}>
          <WallpaperWrapper
            wallpaperUrl={conversationDetails?.wallpaperUrl}
            overlayColor={wallpaperOverlay}
          >
            {messageList}
          </WallpaperWrapper>

          <ScrollToBottomButton
            visible={showScrollToBottom}
            onPress={scrollToBottom}
            backgroundColor={chatPalette.fabBg}
            iconColor={theme.colors.text}
          />
        </View>

        <TypingDock typingDisplayNames={typingDisplayNames} />

        <MessageInput
          onSend={handleSendMessage}
          onSendToAI={sendToAI}
          onSendMedia={handleSendMedia}
          onTyping={
            typingChannelId
              ? () => sendTyping(typingChannelId, true) // true = conversationId
              : undefined
          }
          onStopTyping={
            typingChannelId
              ? () => sendStopTyping(typingChannelId, true) // true = conversationId
              : undefined
          }
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
              await messageAPI.leaveGroup(actualConversationId);
              showAlert('Thông báo', 'Bạn đã rời nhóm');
              router.replace('/messages');
            } catch (e: any) {
              showAlert(
                'Lỗi',
                e?.response?.data?.message || 'Không thể rời nhóm'
              );
            }
          }}
        />

        <AddMembersModal
          visible={isAddMembersVisible}
          theme={theme}
          currentUserId={user?.id || ''} // quan trọng để MutualUserPicker lọc theo người hiện tại
          pendingMembers={pendingMembers}
          setPendingMembers={setPendingMembers}
          existingMemberIds={existingMemberIds}
          isAddingMembers={isAddingMembers}
          onClose={() => setAddMembersVisible(false)}
          onConfirm={async userIds => {
            if (!actualConversationId || !user?.id) return;
            if (!userIds.length) {
              showAlert(
                'Thông báo',
                'Vui lòng chọn ít nhất một thành viên'
              );
              return;
            }
            try {
              setIsAddingMembers(true);
              await messageAPI.addGroupMembers(
                actualConversationId,
                userIds
              );
              showAlert('Thành công', 'Đã thêm thành viên mới');
              setAddMembersVisible(false);
              setPendingMembers({});
              await loadExistingThread(actualConversationId);
            } catch (e: any) {
              showAlert(
                'Lỗi',
                e?.response?.data?.message ||
                'Không thể thêm thành viên'
              );
            } finally {
              setIsAddingMembers(false);
            }
          }}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  messagesWrapper: { flex: 1, position: 'relative' },
  systemMessageContainer: {
    alignItems: 'center',
    marginVertical: 6,
    paddingHorizontal: 16,
  },
  systemMessageText: { fontSize: 12, textAlign: 'center' },
});