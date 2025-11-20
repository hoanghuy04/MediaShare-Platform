import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
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
  ActivityIndicator,
  Modal,
  ScrollView,
  ImageBackground,
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
import { Avatar } from '../../components/common/Avatar';
import { messageAPI, userAPI, messageRequestAPI } from '../../services/api';
import { Conversation, Message, UserProfile } from '../../types';
import { showAlert } from '../../utils/helpers';
import { MutualUserPicker, MutualUserOption } from '../../components/messages/MutualUserPicker';
import { GroupInfoSheet } from '../../components/messages/GroupInfoSheet';

const hexToRgba = (hex?: string, alpha = 1) => {
  if (!hex) return `rgba(0,0,0,${alpha})`;
  const s = hex.replace('#', '');
  if (s.length !== 6) return `rgba(0,0,0,${alpha})`;
  const n = parseInt(s, 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
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
  }>();
  const normalizeParam = (v?: string | string[]) => (Array.isArray(v) ? v[0] : v);

  const routeConversationId = normalizeParam(params.conversationId) || '';
  const routePendingFlag = normalizeParam(params.isNewConversation);
  const routeRequestId = normalizeParam(params.requestId);
  const direction = normalizeParam(params.direction);
  const routeSenderId = normalizeParam(params.senderId);
  const routeReceiverId = normalizeParam(params.receiverId);
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
  const [peerUserId, setPeerUserId] = useState<string | null>(wantsPendingRoute ? routeConversationId : null);
  const [actualConversationId, setActualConversationId] = useState<string | null>(wantsPendingRoute ? null : routeConversationId);
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
  const ensureMessageSender = useCallback((m: Message): Message => {
    if ((m as any).sender?.id || !user) return m;
    return {
      ...m,
      sender: { id: user.id, username: user.username, avatar: user.profile?.avatar, isVerified: !!user.isVerified },
    };
  }, [user]);

  const sortAsc = useCallback((list: Message[]) =>
    [...list].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()), []);

  // ------- load pending/existing -------
  const loadPendingThread = useCallback(async (targetId: string) => {
    if (!targetId || !user?.id) { setIsLoading(false); return; }
    setIsLoading(true);
    try {
      setIsNewConversation(true); setActualConversationId(null); setPeerUserId(targetId); setConversationDetails(null);
      if (!otherUser || otherUser.id !== targetId) {
        const profile = await userAPI.getUserProfile(targetId);
        setOtherUser(profile);
      }
      let pendingMessages: Message[];
      if (routeRequestId) {
        pendingMessages = await messageRequestAPI.getPendingMessagesByRequestId(routeRequestId);
      } else {
        let senderId = routeSenderId, receiverId = routeReceiverId;
        if (!senderId || !receiverId) {
          if (direction === 'received') { senderId = targetId; receiverId = user.id; }
          else { senderId = user.id; receiverId = targetId; }
        }
        pendingMessages = await messageRequestAPI.getPendingMessages(senderId!, receiverId!);
      }
      setMessages(sortAsc(pendingMessages.map(ensureMessageSender)));
    } catch (e) {
      console.error('loadPendingThread', e);
      setMessages([]);
    } finally { setIsLoading(false); }
  }, [direction, ensureMessageSender, otherUser, routeReceiverId, routeRequestId, routeSenderId, sortAsc, user]);

  const loadExistingThread = useCallback(async (convId: string) => {
    if (!convId) { setIsLoading(false); return; }
    setIsLoading(true);
    try {
      const conversation = await messageAPI.getConversation(convId);
      setActualConversationId(conversation.id);
      setIsNewConversation(false);
      setConversationDetails(conversation);

      if (conversation.type === 'DIRECT' && conversation.participants?.length) {
        const other = conversation.participants.find(p => p.userId !== user?.id) || conversation.participants[0];
        if (other) {
          setPeerUserId(other.userId);
          setOtherUser(prev => (prev?.id === other.userId ? prev : {
            id: other.userId,
            username: other.username,
            email: '',
            profile: { avatar: other.avatar },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isVerified: other.isVerified,
          }));
        }
      } else { setPeerUserId(null); setOtherUser(null); }

      const res = await messageAPI.getMessages(conversation.id);
      const ordered = (res.content || []).map(ensureMessageSender);
      setMessages(sortAsc(ordered));

      if (res.content?.length) {
        const unread = res.content.filter(m => m.sender.id !== user?.id && !m.readBy.includes(user?.id || ''));
        if (unread.length) unread.forEach(m => sendReadReceipt(m.id, m.sender.id));
      }
    } catch (err: any) {
      if (err?.response?.status === 404) { await loadPendingThread(convId); return; }
      console.error('loadExistingThread', err);
      setMessages([]);
    } finally { setIsLoading(false); }
  }, [ensureMessageSender, loadPendingThread, sendReadReceipt, sortAsc, user]);

  const transitionToConversation = useCallback((nextId: string) => {
    if (!nextId) return;
    setIsNewConversation(false);
    setActualConversationId(nextId);
    router.replace({ pathname: '/messages/[conversationId]', params: { conversationId: nextId } });
    loadExistingThread(nextId);
  }, [loadExistingThread, router]);

  // ------- websocket -------
  useEffect(() => {
    const onMsg = (packet: any) => {
      const peerId = otherUser?.id || peerUserId || routeConversationId;
      const matchesPeer = peerId && (packet.senderId === peerId || packet.receiverId === peerId);
      const matchesConv = !!packet.conversationId && !!actualConversationId && packet.conversationId === actualConversationId;
      if (packet.type !== 'CHAT' || (!matchesPeer && !matchesConv)) return;
      if (!packet.senderId) return;

      const incoming: Message = {
        id: packet.id || '',
        sender: { id: packet.senderId, username: packet.senderUsername || '', avatar: packet.senderProfileImage, isVerified: false },
        conversationId: packet.conversationId,
        content: packet.content || '',
        mediaUrl: packet.mediaUrl,
        readBy: packet.status === 'READ' ? [user?.id || ''] : [],
        createdAt: packet.timestamp,
        isDeleted: false,
      };

      setMessages(prev => {
        if (prev.some(m => m.id === incoming.id)) return prev;
        if (packet.senderId === user?.id) {
          const replaced = prev.map(m => (m.id.startsWith('temp-') ? incoming : m));
          return sortAsc(replaced);
        }
        return sortAsc([...prev, incoming]);
      });

      if (isNewConversation && packet.conversationId) transitionToConversation(packet.conversationId);
      const peer = otherUser?.id || peerUserId || routeConversationId;
      if (!isNewConversation && peer && packet.senderId === peer && packet.id && packet.senderId !== user?.id) {
        sendReadReceipt(packet.id, packet.senderId);
      }
    };

    const onRr = (messageId: string, senderId: string) => {
      const peer = otherUser?.id || peerUserId || routeConversationId;
      if (!peer || senderId !== peer) return;
      setMessages(prev => prev.map(m => (m.id === messageId ? { ...m, readBy: [...m.readBy, senderId] } : m)));
    };

    const onTp = (isTyping: boolean, uid: string) => {
      const peer = otherUser?.id || peerUserId || routeConversationId;
      if (!peer || uid !== peer) return;
      setTypingUsers(prev => (isTyping ? (prev.includes(uid) ? prev : [...prev, uid]) : prev.filter(id => id !== uid)));
    };

    onMessage(onMsg);
    onReadReceipt(onRr);
    onTyping(onTp);
  }, [
    actualConversationId, isNewConversation, onMessage, onReadReceipt, onTyping,
    otherUser, peerUserId, routeConversationId, sendReadReceipt, transitionToConversation, user?.id
  ]);

  useEffect(() => {
    if (!routeConversationId) { setIsLoading(false); return; }
    if (wantsPendingRoute) loadPendingThread(routeConversationId);
    else loadExistingThread(routeConversationId);
  }, [routeConversationId, wantsPendingRoute, loadExistingThread, loadPendingThread]);

  // ------- send message -------
  const handleSendMessage = async (content: string) => {
    const targetUserId = otherUser?.id || peerUserId || routeConversationId;
    if (!targetUserId) { showAlert('Error', 'Unable to determine recipient.'); return; }

    try {
      const optimistic: Message = {
        id: `temp-${Date.now()}`,
        sender: { id: user?.id || '', username: user?.username || '', avatar: user?.profile?.avatar, isVerified: !!user?.isVerified },
        content,
        readBy: [],
        createdAt: new Date().toISOString(),
        isDeleted: false,
      };
      setMessages(prev => sortAsc([...prev, optimistic]));

      if (isNewConversation) {
        const newMsg = await messageAPI.sendDirectMessage(targetUserId, content);
        if (!newMsg.sender) return; // giữ nguyên optimistic nếu BE lỗi
        setMessages(prev => sortAsc(prev.map(m => (m.id === optimistic.id ? ensureMessageSender(newMsg) : m))));
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
          setMessages(prev => sortAsc(prev.map(m => (m.id === optimistic.id ? ensureMessageSender(newMsg) : m))));
        }
      }
    } catch (e: any) {
      setMessages(prev => prev.filter(m => !m.id.startsWith('temp-')));
      showAlert('Error', e?.message || 'Failed to send message');
    }
  };

  // ------- cluster flags -------
  const CLUSTER_MS = 2 * 60 * 1000;
  const getClusterFlags = useCallback((index: number) => {
    const cur = messages[index], prev = messages[index - 1], next = messages[index + 1];
    const samePrev = !!prev && prev.sender?.id === cur?.sender?.id &&
      new Date(cur.createdAt).getTime() - new Date(prev.createdAt).getTime() <= CLUSTER_MS;
    const sameNext = !!next && next.sender?.id === cur?.sender?.id &&
      new Date(next.createdAt).getTime() - new Date(cur.createdAt).getTime() <= CLUSTER_MS;
    return { isClusterStart: !samePrev, isClusterEnd: !sameNext, isClusterMiddle: samePrev && sameNext };
  }, [messages]);

  const handleScrollToMessage = useCallback((id: string) => {
    const idx = messages.findIndex(m => m.id === id);
    if (idx >= 0) flatListRef.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0.5 });
  }, [messages]);

  // ------- renders -------
  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    if (!item.sender) {
      return (
        <View style={styles.systemMessageContainer}>
          <Text style={[styles.systemMessageText, { color: theme.colors.textSecondary }]}>{item.content}</Text>
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
          <Text style={[styles.readReceiptLabel, { color: theme.colors.textSecondary }]}>Đã xem</Text>
        )}
      </View>
    );
  };

  const header = (() => {
    const title = isGroupConversation
      ? conversationDetails?.name || 'Nhóm chat'
      : otherUser?.username || conversationDetails?.name || 'Cuộc trò chuyện';
    const subtitle = isGroupConversation
      ? `${conversationDetails?.participants?.length || 0} thành viên`
      : connectionStatus === 'connected' ? 'Đang hoạt động' : 'Ngoại tuyến';
    const avatarSrc = isGroupConversation ? conversationDetails?.avatar : otherUser?.profile?.avatar;

    return (
      <SafeAreaView style={[styles.header, { backgroundColor: 'transparent' }]}>
        <StatusBar barStyle="light-content" />
        <View style={[styles.headerContent, { backgroundColor: hexToRgba(chatPalette.headerBg, 0.92) }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={chatPalette.headerText} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerInfo}
            onPress={() =>
              router.push({
                pathname: '/messages/conversation-settings',
                params: { userId: otherUser?.id || peerUserId || '', conversationId: actualConversationId || routeConversationId || '' },
              })
            }
          >
            <Avatar uri={avatarSrc} name={title} size={40} />
            <View style={styles.headerTextGroup}>
              <View style={styles.headerTitleRow}>
                <Text style={[styles.userName, { color: chatPalette.headerText }]} numberOfLines={1}>{title}</Text>
                {!isGroupConversation && (
                  <View style={[styles.onlineDot, { backgroundColor: connectionStatus === 'connected' ? '#34D399' : '#94A3B8' }]} />
                )}
              </View>
              <Text style={[styles.userHandle, { color: chatPalette.headerText, opacity: 0.9 }]}>{subtitle}</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.actionButton}><Ionicons name="call-outline" size={20} color={chatPalette.headerText} /></TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}><Ionicons name="videocam-outline" size={20} color={chatPalette.headerText} /></TouchableOpacity>
            <TouchableOpacity
  style={styles.actionButton}
  onPress={() => {
    const isGroup = conversationDetails?.type === 'GROUP';
    if (isGroup) {
      // Nhóm: mở settings theo conversation
      router.push({
        pathname: '/messages/conversation-settings',
        params: {
          conversationId: actualConversationId || routeConversationId || '',
        },
      });
    } else {
      // Direct / Pending: mở settings theo user
      router.push({
        pathname: '/messages/conversation-settings',
        params: {
          userId: otherUser?.id || peerUserId || '',
        },
      });
    }
  }}
  onLongPress={() => setGroupInfoVisible(true)} // tuỳ chọn: giữ long-press để mở sheet cũ
>
  <Ionicons name="information-circle-outline" size={22} color={chatPalette.headerText} />
</TouchableOpacity>

          </View>
        </View>
      </SafeAreaView>
    );
  })();

  const contactIntro = (
    <View style={styles.contactInfo}>
      <Image source={{ uri: otherUser?.profile?.avatar || 'https://via.placeholder.com/100' }} style={styles.largeAvatar} />
      <Text style={[styles.contactName, { color: theme.colors.text }]}>{otherUser?.profile?.firstName || otherUser?.username || 'User'}</Text>
      <Text style={[styles.contactHandle, { color: theme.colors.textSecondary }]}>@{otherUser?.username || 'user'}</Text>
      <TouchableOpacity style={[styles.profileButton, { backgroundColor: hexToRgba(theme.colors.border, 0.6) }]}>
        <Text style={[styles.profileButtonText, { color: theme.colors.text }]}>Xem trang cá nhân</Text>
      </TouchableOpacity>
    </View>
  );

  const pendingBanner = (
    <View style={[styles.pendingBanner, { backgroundColor: hexToRgba(theme.colors.warning, 0.08), borderColor: hexToRgba(theme.colors.warning, 0.5) }]}>
      <Ionicons name="time-outline" size={18} color={theme.colors.warning || '#FF9500'} />
      <View style={styles.pendingBannerText}>
        <Text style={[styles.pendingBannerTitle, { color: theme.colors.text }]}>Tin nhắn đang chờ</Text>
        <Text style={[styles.pendingBannerSubtitle, { color: theme.colors.textSecondary }]}>Người nhận cần chấp nhận để bắt đầu cuộc trò chuyện.</Text>
      </View>
    </View>
  );

  const mediaStrip = recentMedia.length ? (
    <View style={styles.mediaStripContainer}>
      <Text style={[styles.mediaStripTitle, { color: theme.colors.text }]}>Ảnh/Video gần đây</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 16 }}>
        {recentMedia.map(m => (
          <TouchableOpacity key={m.id} style={styles.mediaPreview} onPress={() => { }}>
            <Image source={{ uri: m.mediaUrl || undefined }} style={styles.mediaImage} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  ) : null;

  const dateSeparator = (
    <View style={styles.dateSeparator}>
      <View style={[styles.datePill, { backgroundColor: hexToRgba(theme.colors.card, 0.9), borderColor: hexToRgba(theme.colors.border, 0.9) }]}>
        <Text style={[styles.dateText, { color: theme.colors.textSecondary }]}>04 thg 9, 2024</Text>
      </View>
    </View>
  );

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
        canUseRealtime && connectionStatus !== 'connected'
          ? <ConnectionStatus status={connectionStatus} onRetry={() => { }} />
          : null
      }
      ListFooterComponent={<View style={styles.listFooter} />}
    />
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {header}
        <LoadingSpinner />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {header}

      {isNewConversation && pendingBanner}
      {messages.length === 0 && otherUser && !isGroupConversation && contactIntro}
      {mediaStrip}
      {messages.length > 0 && dateSeparator}

      <View style={styles.messagesWrapper}>
        {conversationDetails?.wallpaperUrl ? (
          <ImageBackground source={{ uri: conversationDetails.wallpaperUrl }} style={styles.wallpaperBackground} blurRadius={0}>
            <View style={[styles.wallpaperOverlay, { backgroundColor: wallpaperOverlay }]} />
            {messageList}
          </ImageBackground>
        ) : (
          messageList
        )}

        {showScrollToBottom && (
          <TouchableOpacity style={[styles.scrollFab, { backgroundColor: chatPalette.fabBg }]} onPress={scrollToBottom}>
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
        onTyping={typingChannelId ? () => sendTyping(typingChannelId) : undefined}
        onStopTyping={typingChannelId ? () => sendStopTyping(typingChannelId) : undefined}
        placeholder={isNewConversation ? 'Tin nhắn sẽ được gửi dưới dạng yêu cầu' : 'Nhắn tin...'}
        themeColor={chatPalette.bubbleOut}
      />

      <GroupInfoSheet
        visible={isGroupInfoVisible}
        conversation={conversationDetails || undefined}
        currentUserId={user?.id || ''}
        onClose={() => setGroupInfoVisible(false)}
        onAddMembers={() => { setPendingMembers({}); setAddMembersVisible(true); setGroupInfoVisible(false); }}
        onLeaveGroup={async () => {
          if (!actualConversationId || !user?.id) return;
          try { await messageAPI.leaveGroup(actualConversationId, user.id); showAlert('Thông báo', 'Bạn đã rời nhóm'); router.replace('/messages'); }
          catch (e: any) { showAlert('Lỗi', e?.response?.data?.message || 'Không thể rời nhóm'); }
        }}
      />

      {/* Add members modal */}
      <Modal visible={isAddMembersVisible} animationType="slide" onRequestClose={() => setAddMembersVisible(false)}>
        <SafeAreaView style={[styles.addMembersModal, { backgroundColor: theme.colors.background }]}>
          <View style={styles.addMembersHeader}>
            <TouchableOpacity onPress={() => setAddMembersVisible(false)}><Ionicons name="close" size={22} color={theme.colors.text} /></TouchableOpacity>
            <Text style={[styles.addMembersTitle, { color: theme.colors.text }]}>Thêm thành viên</Text>
            <View style={{ width: 24 }} />
          </View>

          <MutualUserPicker
            currentUserId={user?.id || ''}
            selectedUsers={pendingMembers}
            onSelectedChange={setPendingMembers}
            excludeUserIds={existingMemberIds}
            emptyMessage="Chỉ hiện những người theo dõi nhau"
          />

          <View style={styles.addMembersActions}>
            <TouchableOpacity
              style={[styles.addMembersSecondaryBtn, { borderColor: theme.colors.border || '#e0e0e0' }]}
              onPress={() => setAddMembersVisible(false)}
            >
              <Text style={[styles.addMembersSecondaryText, { color: theme.colors.text }]}>Huỷ</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.addMembersPrimaryBtn,
                { backgroundColor: theme.colors.primary, opacity: Object.keys(pendingMembers).length === 0 || isAddingMembers ? 0.4 : 1 },
              ]}
              onPress={async () => {
                if (!actualConversationId || !user?.id) return;
                const userIds = Object.keys(pendingMembers);
                if (!userIds.length) return showAlert('Thông báo', 'Vui lòng chọn ít nhất một thành viên');
                try {
                  setIsAddingMembers(true);
                  await messageAPI.addGroupMembers(actualConversationId, user.id, userIds);
                  showAlert('Thành công', 'Đã thêm thành viên mới');
                  setAddMembersVisible(false);
                  setPendingMembers({});
                  await loadExistingThread(actualConversationId);
                } catch (e: any) {
                  showAlert('Lỗi', e?.response?.data?.message || 'Không thể thêm thành viên');
                } finally { setIsAddingMembers(false); }
              }}
              disabled={Object.keys(pendingMembers).length === 0 || isAddingMembers}
            >
              {isAddingMembers ? <ActivityIndicator size="small" color="white" /> : <Text style={styles.addMembersPrimaryText}>Thêm</Text>}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header: bar mờ, card-like
  header: { zIndex: 5 },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 3 },
    }),
  },
  backButton: { marginRight: 10, padding: 6, borderRadius: 18 },
  headerInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  headerTextGroup: { marginLeft: 10, flex: 1 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center' },
  userName: { fontSize: 17, fontWeight: '700', flexShrink: 1 },
  userHandle: { fontSize: 12, marginTop: 2 },
  onlineDot: { width: 9, height: 9, borderRadius: 5, marginLeft: 6 },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  actionButton: { padding: 8, marginLeft: 6 },

  // Intro & banner
  contactInfo: { alignItems: 'center', paddingVertical: 36, paddingHorizontal: 20 },
  largeAvatar: { width: 96, height: 96, borderRadius: 48, marginBottom: 14 },
  contactName: { fontSize: 22, fontWeight: '600', marginBottom: 4 },
  contactHandle: { fontSize: 14, marginBottom: 18 },
  profileButton: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 18 },
  profileButtonText: { fontSize: 15, fontWeight: '600' },

  pendingBanner: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginTop: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    borderRadius: 12, borderWidth: 1,
  },
  pendingBannerText: { marginLeft: 12, flex: 1 },
  pendingBannerTitle: { fontSize: 14, fontWeight: '700' },
  pendingBannerSubtitle: { fontSize: 12, marginTop: 2 },

  // Date separator pill
  dateSeparator: { alignItems: 'center', marginTop: 6, marginBottom: 2 },
  datePill: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 14, borderWidth: StyleSheet.hairlineWidth,
  },
  dateText: { fontSize: 12, fontWeight: '600' },

  // Message list & background
  messagesWrapper: { flex: 1, position: 'relative' },
  wallpaperBackground: { flex: 1 },
  wallpaperOverlay: { ...StyleSheet.absoluteFillObject },
  messagesList: { paddingRight: 6, paddingLeft: 36, paddingTop: 8, paddingBottom: 64 },
  listFooter: { height: 40 },

  // Floating “scroll to bottom”
  scrollFab: {
    position: 'absolute', right: 16, bottom: 20,
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 6 },
    }),
  },

  typingDock: { paddingHorizontal: 16, paddingVertical: 4 },

  // System message
  systemMessageContainer: { alignItems: 'center', marginVertical: 6, paddingHorizontal: 16 },
  systemMessageText: { fontSize: 12, textAlign: 'center' },

  // Media strip
  mediaStripContainer: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  mediaStripTitle: { fontSize: 14, fontWeight: '700', marginBottom: 6 },
  mediaPreview: {
    width: 84, height: 84, borderRadius: 12, overflow: 'hidden', marginRight: 10, backgroundColor: '#EEE',
  },
  mediaImage: { width: '100%', height: '100%' },

  // Add members modal
  addMembersModal: { flex: 1 },
  addMembersHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  addMembersTitle: { fontSize: 16, fontWeight: '700' },
  addMembersActions: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  addMembersPrimaryBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10 },
  addMembersPrimaryText: { color: 'white', fontWeight: '700', fontSize: 15 },
  addMembersSecondaryBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10, borderWidth: 1 },
  addMembersSecondaryText: { fontWeight: '700', fontSize: 15 },
});
