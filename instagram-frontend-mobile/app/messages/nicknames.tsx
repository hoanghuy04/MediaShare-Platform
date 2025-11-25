import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { useConversation } from '../../context/ConversationContext';
import { useWebSocket } from '../../context/WebSocketContext';
import { messageAPI } from '../../services/message.service';
import { Avatar } from '../../components/common/Avatar';
import { Input } from '../../components/common/Input';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { showAlert } from '../../utils/helpers';
import type { Conversation } from '../../types';
import { SafeAreaView } from 'react-native-safe-area-context';

type Participant = Conversation['participants'][number] & {
  role?: 'ADMIN' | 'MEMBER';
};

export default function NicknamesScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const params = useLocalSearchParams<{ conversationId: string }>();
  const conversationId = Array.isArray(params.conversationId)
    ? params.conversationId[0]
    : params.conversationId;

  // ConversationContext
  const {
    conversation,
    loading: isLoading,
    refresh: refreshConversation,
  } = useConversation(conversationId);
  const { onConversationUpdate } = useWebSocket();

  // State for nickname modal
  const [isNicknameModalVisible, setNicknameModalVisible] = useState(false);
  const [nicknameValue, setNicknameValue] = useState('');
  const [isUpdatingNickname, setIsUpdatingNickname] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Participant | null>(null);

  // Helper function to get display name (nickname > username)
  const getDisplayName = useCallback((member: Participant): string => {
    return member.nickname?.trim() || member.username;
  }, []);

  // Handle WebSocket NICKNAME_UPDATED event
  useEffect(() => {
    if (!onConversationUpdate || !conversationId) return;

    const unsubscribe = onConversationUpdate((update) => {
      if (update.conversationId !== conversationId) return;
      if (update.updateType === 'NICKNAME_UPDATED') {
        refreshConversation();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [onConversationUpdate, conversationId, refreshConversation]);

  const members = useMemo(() => {
    const list = (conversation?.participants ?? []) as Participant[];
    return list;
  }, [conversation?.participants]);

  const openNicknameModal = (member: Participant) => {
    setSelectedMember(member);
    setNicknameValue(member.nickname || '');
    setNicknameModalVisible(true);
  };

  const handleUpdateNickname = async () => {
    if (!conversationId || !selectedMember) return;

    const trimmed = nicknameValue.trim();
    const finalNickname = trimmed === '' ? null : trimmed;

    if (finalNickname && finalNickname.length > 50) {
      showAlert('Lỗi', 'Biệt danh không được vượt quá 50 ký tự');
      return;
    }

    try {
      setIsUpdatingNickname(true);
      await messageAPI.updateNickname(conversationId, selectedMember.userId, finalNickname);
      setNicknameModalVisible(false);
      setNicknameValue('');
      setSelectedMember(null);
      await refreshConversation();
    } catch (e: any) {
      showAlert('Lỗi', e?.response?.data?.message || 'Không thể cập nhật biệt danh');
    } finally {
      setIsUpdatingNickname(false);
    }
  };

  const handleRemoveNickname = async (member: Participant) => {
    if (!conversationId) return;
    try {
      await messageAPI.updateNickname(conversationId, member.userId, null);
      await refreshConversation();
    } catch (e: any) {
      showAlert('Lỗi', e?.response?.data?.message || 'Không thể xóa biệt danh');
    }
  };

  const Header = (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={() => router.back()}
        style={styles.headerBtn}
      >
        <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
        Biệt danh
      </Text>
      <View style={styles.headerBtn} />
    </View>
  );

  const UserRow = ({ p }: { p: Participant }) => {
    const displayName = getDisplayName(p);
    const hasNickname = !!p.nickname?.trim();
    const isMe = p.userId === currentUser?.id;

    return (
      <TouchableOpacity
        style={styles.row}
        onPress={() => openNicknameModal(p)}
        activeOpacity={0.7}
      >
        <View style={styles.rowLeft}>
          <Avatar uri={p.avatar} name={p.username} size={48} />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text
              style={[styles.rowName, { color: theme.colors.text }]}
              numberOfLines={1}
            >
              {displayName}
            </Text>
            <Text
              style={[styles.rowSub, { color: theme.colors.textSecondary }]}
              numberOfLines={1}
            >
              {hasNickname ? `@${p.username}` : `@${p.username}`}
              {isMe && ' • Bạn'}
            </Text>
          </View>
        </View>
        <View style={styles.rowRight}>
          {hasNickname && (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                handleRemoveNickname(p);
              }}
              style={styles.removeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name="close-circle"
                size={20}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
          )}
          <Ionicons
            name="chevron-forward"
            size={20}
            color={theme.colors.textSecondary}
          />
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        {Header}
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <LoadingSpinner />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {Header}

      <View style={styles.infoSection}>
        <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
          Đặt biệt danh cho mọi người trong cuộc trò chuyện này. Chỉ bạn mới thấy biệt danh này.
        </Text>
      </View>

      <FlatList
        data={members}
        keyExtractor={item => item.userId}
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: 16 }}>
            <UserRow p={item} />
          </View>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      />

      {/* Nickname Modal */}
      <Modal
        visible={isNicknameModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setNicknameModalVisible(false)}
      >
        <View style={styles.sheetOverlay}>
          <TouchableOpacity
            style={[StyleSheet.absoluteFill as any, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}
            onPress={() => setNicknameModalVisible(false)}
            activeOpacity={1}
          />
          <View
            style={[styles.sheet, { backgroundColor: theme.colors.background }]}
          >
            <View style={styles.sheetHandle} />
            
            {/* Header */}
            <View style={[styles.modalHeader, { borderBottomColor: theme.colors.textSecondary + '20' }]}>
              <TouchableOpacity
                onPress={() => {
                  setNicknameModalVisible(false);
                  setNicknameValue('');
                  setSelectedMember(null);
                }}
                style={styles.modalHeaderButton}
              >
                <Text
                  style={[
                    styles.modalHeaderButtonText,
                    { color: theme.colors.text },
                  ]}
                >
                  Hủy
                </Text>
              </TouchableOpacity>
              <Text
                style={[
                  styles.modalHeaderTitle,
                  { color: theme.colors.text },
                ]}
              >
                Chỉnh sửa biệt danh
              </Text>
              <TouchableOpacity
                onPress={handleUpdateNickname}
                disabled={isUpdatingNickname}
                style={styles.modalHeaderButton}
              >
                <Text
                  style={[
                    styles.modalHeaderButtonText,
                    {
                      color: isUpdatingNickname
                        ? theme.colors.textSecondary
                        : theme.colors.primary,
                      fontWeight: '700',
                      opacity: isUpdatingNickname ? 0.6 : 1,
                    },
                  ]}
                >
                  {isUpdatingNickname ? 'Đang lưu...' : 'Xong'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Content */}
            <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 }}>
              {/* Avatar */}
              <View style={{ alignItems: 'center', marginBottom: 24 }}>
                <Avatar
                  uri={selectedMember?.avatar}
                  name={selectedMember?.username || ''}
                  size={80}
                />
              </View>
              
              <Input
                value={nicknameValue}
                onChangeText={setNicknameValue}
                placeholder="Nhập biệt danh"
                maxLength={50}
                autoFocus
                style={{ marginBottom: 8 }}
              />
              <Text
                style={[
                  {
                    fontSize: 12,
                    color: theme.colors.textSecondary,
                    textAlign: 'center',
                  },
                ]}
              >
                Mọi người trong đoạn chat đều sẽ nhìn thấy biệt danh này
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  headerBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
  },
  infoSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowName: { fontSize: 16, fontWeight: '600' },
  rowSub: { fontSize: 13, marginTop: 2 },
  removeButton: {
    padding: 4,
  },
  separator: { height: 1, backgroundColor: '#f1f5f9' },
  sheetOverlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 18,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: -2 },
      },
      android: { elevation: 24 },
    }),
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 52,
    height: 4,
    borderRadius: 999,
    backgroundColor: '#cbd5e1',
    marginVertical: 10,
  },
  modalButton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalHeaderButton: {
    minWidth: 60,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeaderButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
});

