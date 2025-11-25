import React, { useEffect, useMemo, useState, useCallback } from 'react';
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
import { MessageButton } from '../../components/common/MessageButton';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Input } from '../../components/common/Input';
import { showAlert } from '../../utils/helpers';
import type { Conversation } from '../../types';
import { AddMembersModal } from '../../components/messages/AddMembersModal';
import { MutualUserOption } from '../../components/messages/MutualUserPicker';
import { SafeAreaView } from 'react-native-safe-area-context';

type Participant = Conversation['participants'][number] & {
  role?: 'ADMIN' | 'MEMBER';
};

export default function GroupMembersScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const params = useLocalSearchParams<{ conversationId: string }>();
  const conversationId = Array.isArray(params.conversationId)
    ? params.conversationId[0]
    : params.conversationId;

  const [menuVisible, setMenuVisible] = useState(false);

  // ConversationContext
  const {
    conversation,
    status: conversationStatus,
    loading: isLoading,
    refresh: refreshConversation,
  } = useConversation(conversationId);
  const [menuTarget, setMenuTarget] = useState<Participant | null>(null);

  // state cho AddMembersModal
  const [isAddMembersVisible, setAddMembersVisible] = useState(false);
  const [pendingMembers, setPendingMembers] = useState<
    Record<string, MutualUserOption>
  >({});
  const [isAddingMembers, setIsAddingMembers] = useState(false);

  // state cho nickname modal
  const [isNicknameModalVisible, setNicknameModalVisible] = useState(false);
  const [nicknameValue, setNicknameValue] = useState('');
  const [isUpdatingNickname, setIsUpdatingNickname] = useState(false);

  const { onConversationUpdate } = useWebSocket();

  const isCurrentAdmin = useMemo(() => {
    const me = conversation?.participants?.find(
      p => p.userId === currentUser?.id
    ) as Participant | undefined;
    return (me?.role ?? 'MEMBER') === 'ADMIN';
  }, [conversation?.participants, currentUser?.id]);

  const members = useMemo(() => {
    const list = (conversation?.participants ?? []) as Participant[];
    const me = list.find(p => p.userId === currentUser?.id);
    const others = list.filter(p => p.userId !== currentUser?.id);
    return { me, others };
  }, [conversation?.participants, currentUser?.id]);

  const existingMemberIds = useMemo(
    () => conversation?.participants?.map(p => p.userId) ?? [],
    [conversation?.participants]
  );

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

  const handleUpdateNickname = async () => {
    if (!conversationId || !menuTarget) return;

    const trimmed = nicknameValue.trim();
    const finalNickname = trimmed === '' ? null : trimmed;

    if (finalNickname && finalNickname.length > 50) {
      showAlert('Lỗi', 'Biệt danh không được vượt quá 50 ký tự');
      return;
    }

    try {
      setIsUpdatingNickname(true);
      await messageAPI.updateNickname(conversationId, menuTarget.userId, finalNickname);
      setNicknameModalVisible(false);
      setNicknameValue('');
      await refreshConversation();
    } catch (e: any) {
      showAlert('Lỗi', e?.response?.data?.message || 'Không thể cập nhật biệt danh');
    } finally {
      setIsUpdatingNickname(false);
    }
  };

  const openNicknameModal = (member: Participant) => {
    setMenuTarget(member);
    setNicknameValue(member.nickname || '');
    setNicknameModalVisible(true);
    closeMenu();
  };

  const openRemoveNickname = async (member: Participant) => {
    if (!conversationId) return;
    try {
      await messageAPI.updateNickname(conversationId, member.userId, null);
      showAlert('Thành công', 'Đã xóa biệt danh');
      closeMenu();
      await refreshConversation();
    } catch (e: any) {
      showAlert('Lỗi', e?.response?.data?.message || 'Không thể xóa biệt danh');
    }
  };

  const openMenu = (p: Participant) => {
    setMenuTarget(p);
    setMenuVisible(true);
  };
  const closeMenu = () => {
    setMenuVisible(false);
    setMenuTarget(null);
  };

  const removeMember = async (uid: string) => {
    try {
      if (!conversationId) return;
      await messageAPI.removeGroupMember(conversationId, uid);
      showAlert('Thành công', 'Đã xóa người dùng khỏi nhóm');
      closeMenu();
      await refreshConversation();
    } catch (e: any) {
      showAlert(
        'Lỗi',
        e?.response?.data?.message || 'Không thể xóa người dùng'
      );
    }
  };

  const makeAdmin = async (uid: string) => {
    try {
      if (!conversationId) return;
      await messageAPI.promoteGroupAdmin(conversationId, uid);
      showAlert('Thành công', 'Đã chỉ định quản trị viên');
      closeMenu();
      await refreshConversation();
    } catch (e: any) {
      showAlert(
        'Lỗi',
        e?.response?.data?.message || 'Không thể chỉ định quản trị viên'
      );
    }
  };

  const removeAdmin = async (uid: string) => {
    try {
      if (!conversationId) return;
      await messageAPI.demoteGroupAdmin(conversationId, uid);
      showAlert('Thành công', 'Đã gỡ vai trò quản trị viên');
      closeMenu();
      await refreshConversation();
    } catch (e: any) {
      showAlert(
        'Lỗi',
        e?.response?.data?.message || 'Không thể gỡ quyền quản trị'
      );
    }
  };

  const handleAddMembersConfirm = async (userIds: string[]) => {
    if (!conversationId || !currentUser?.id) return;
    if (!userIds.length) {
      showAlert('Thông báo', 'Vui lòng chọn ít nhất một thành viên');
      return;
    }
    try {
      setIsAddingMembers(true);
      await messageAPI.addGroupMembers(conversationId, userIds);
      showAlert('Thành công', 'Đã thêm thành viên mới');
      setAddMembersVisible(false);
      setPendingMembers({});
      await refreshConversation();
    } catch (e: any) {
      showAlert(
        'Lỗi',
        e?.response?.data?.message || 'Không thể thêm thành viên'
      );
    } finally {
      setIsAddingMembers(false);
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
        Mọi người
      </Text>
      <TouchableOpacity
        style={styles.headerBtn}
        onPress={() => {
          setPendingMembers({});
          setAddMembersVisible(true);
        }}
      >
        <Ionicons
          name="person-add-outline"
          size={22}
          color={theme.colors.text}
        />
      </TouchableOpacity>
    </View>
  );

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
      {children}
    </Text>
  );

  const RoleBadge = ({ role }: { role?: 'ADMIN' | 'MEMBER' }) =>
    role === 'ADMIN' ? (
      <Text
        style={[styles.roleBadge, { color: theme.colors.textSecondary }]}
      >
        Quản trị viên
      </Text>
    ) : null;

  const UserRow = ({ p, isMe = false }: { p: Participant; isMe?: boolean }) => {
    const displayName = getDisplayName(p);
    const hasNickname = !!p.nickname?.trim();
    return (
      <View style={styles.row}>
        <View style={styles.rowLeft}>
          <Avatar uri={p.avatar} name={p.username} size={44} />
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
              <RoleBadge role={p.role} />
              {p.role === 'ADMIN' ? ' • ' : ''}
              {hasNickname ? `@${p.username}` : `@${p.username}`}
            </Text>
          </View>
        </View>

      {!isMe && (
        <>
          <MessageButton
            userId={p.userId}
            size="small"
            style={{ marginRight: 8 }}
          />

          <TouchableOpacity
            style={styles.kebab}
            onPress={() => openMenu(p)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name="ellipsis-vertical"
              size={18}
              color={theme.colors.text}
            />
          </TouchableOpacity>
        </>
      )}
    </View>
    );
  };

  const renderMenu = () => {
    if (!menuTarget) return null;

    const targetIsAdmin = (menuTarget.role ?? 'MEMBER') === 'ADMIN';

    const NonAdminViewer = (
      <>
        <MenuTitle label={getDisplayName(menuTarget)} />
        <MenuItem
          label={menuTarget.nickname ? "Đổi biệt danh" : "Đặt biệt danh"}
          onPress={() => openNicknameModal(menuTarget)}
        />
        {menuTarget.nickname && (
          <MenuItem
            label="Xóa biệt danh"
            onPress={() => openRemoveNickname(menuTarget)}
          />
        )}
        <MenuItem
          label="Hạn chế"
          danger
          onPress={() => {
            closeMenu();
            showAlert('Thông báo', 'Tính năng đang phát triển');
          }}
        />
        <MenuItem
          label="Chặn"
          danger
          onPress={() => {
            closeMenu();
            showAlert('Thông báo', 'Tính năng đang phát triển');
          }}
        />
        <MenuItem
          label="Báo cáo đoạn chat"
          danger
          onPress={() => {
            closeMenu();
            showAlert('Thông báo', 'Tính năng đang phát triển');
          }}
        />
      </>
    );

    const AdminViewer_TargetNonAdmin = (
      <>
        <MenuTitle label={getDisplayName(menuTarget)} />
        <MenuItem
          label={menuTarget.nickname ? "Đổi biệt danh" : "Đặt biệt danh"}
          onPress={() => openNicknameModal(menuTarget)}
        />
        {menuTarget.nickname && (
          <MenuItem
            label="Xóa biệt danh"
            onPress={() => openRemoveNickname(menuTarget)}
          />
        )}
        <MenuItem
          label="Xóa người dùng"
          danger
          onPress={() => removeMember(menuTarget.userId)}
        />
        <MenuItem
          label="Chỉ định làm quản trị viên"
          onPress={() => makeAdmin(menuTarget.userId)}
        />
        <MenuItem
          label="Hạn chế"
          danger
          onPress={() => {
            closeMenu();
            showAlert('Thông báo', 'Tính năng đang phát triển');
          }}
        />
        <MenuItem
          label="Chặn"
          danger
          onPress={() => {
            closeMenu();
            showAlert('Thông báo', 'Tính năng đang phát triển');
          }}
        />
        <MenuItem
          label="Báo cáo đoạn chat"
          danger
          onPress={() => {
            closeMenu();
            showAlert('Thông báo', 'Tính năng đang phát triển');
          }}
        />
      </>
    );

    const AdminViewer_TargetAdmin = (
      <>
        <MenuTitle label={getDisplayName(menuTarget)} />
        <MenuItem
          label={menuTarget.nickname ? "Đổi biệt danh" : "Đặt biệt danh"}
          onPress={() => openNicknameModal(menuTarget)}
        />
        {menuTarget.nickname && (
          <MenuItem
            label="Xóa biệt danh"
            onPress={() => openRemoveNickname(menuTarget)}
          />
        )}
        <MenuItem
          label="Xóa người dùng"
          danger
          onPress={() => removeMember(menuTarget.userId)}
        />
        <MenuItem
          label="Gỡ vai trò quản trị viên"
          onPress={() => removeAdmin(menuTarget.userId)}
        />
        <MenuItem
          label="Hạn chế"
          danger
          onPress={() => {
            closeMenu();
            showAlert('Thông báo', 'Tính năng đang phát triển');
          }}
        />
        <MenuItem
          label="Chặn"
          danger
          onPress={() => {
            closeMenu();
            showAlert('Thông báo', 'Tính năng đang phát triển');
          }}
        />
        <MenuItem
          label="Báo cáo đoạn chat"
          danger
          onPress={() => {
            closeMenu();
            showAlert('Thông báo', 'Tính năng đang phát triển');
          }}
        />
      </>
    );

    let body: React.ReactNode = NonAdminViewer;
    if (isCurrentAdmin) {
      body = targetIsAdmin
        ? AdminViewer_TargetAdmin
        : AdminViewer_TargetNonAdmin;
    }

    return (
      <Modal
        visible={menuVisible}
        transparent
        animationType="slide"
        onRequestClose={closeMenu}
      >
        <View style={styles.sheetOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill as any}
            onPress={closeMenu}
          />
          <View
            style={[styles.sheet, { backgroundColor: theme.colors.background }]}
          >
            <View style={styles.sheetHandle} />
            {body}
          </View>
        </View>
      </Modal>
    );
  };

  if (isLoading) {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        {Header}
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <LoadingSpinner />
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {Header}

      <FlatList
        ListHeaderComponent={
          <View
            style={{
              paddingHorizontal: 16,
              paddingTop: 12,
              paddingBottom: 8,
            }}
          >
            <SectionTitle>Bạn</SectionTitle>
            {members.me && <UserRow p={members.me} isMe />}

            <View style={{ height: 18 }} />
            <SectionTitle>Thành viên khác</SectionTitle>
          </View>
        }
        data={members.others}
        keyExtractor={item => item.userId}
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: 16 }}>
            <UserRow p={item} />
          </View>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      />

      {renderMenu()}

      <AddMembersModal
        visible={isAddMembersVisible}
        theme={theme}
        currentUserId={currentUser?.id || ''}
        pendingMembers={pendingMembers}
        setPendingMembers={setPendingMembers}
        existingMemberIds={existingMemberIds}
        isAddingMembers={isAddingMembers}
        onClose={() => setAddMembersVisible(false)}
        onConfirm={handleAddMembersConfirm}
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
                  uri={menuTarget?.avatar}
                  name={menuTarget?.username || ''}
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
                    marginBottom: 24,
                  },
                ]}
              >
                Tối đa 50 ký tự. Để trống để xóa biệt danh.
              </Text>
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

/** ---------- small UI pieces ---------- */
function MenuTitle({ label }: { label: string }) {
  return (
    <View style={{ paddingTop: 8 }}>
      <Text
        style={{
          fontSize: 16,
          fontWeight: '700',
          paddingHorizontal: 16,
          paddingBottom: 32,
        }}
      >
        {label}
      </Text>
      <View style={{ height: 1, backgroundColor: '#e5e7eb' }} />
    </View>
  );
}

function MenuItem({
  label,
  onPress,
  danger,
}: {
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={{ paddingVertical: 14, paddingHorizontal: 16 }}
    >
      <Text
        style={{
          fontSize: 16,
          fontWeight: danger ? ('700' as const) : ('500' as const),
          color: danger ? '#ef4444' : '#111827',
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

/** ---------- styles ---------- */
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
    textAlign: 'left',
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 4,
  },

  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  rowName: { fontSize: 16, fontWeight: '600' },
  rowSub: { fontSize: 12, marginTop: 2 },
  roleBadge: { fontSize: 12, fontWeight: '600' },

  msgBtn: {
    paddingHorizontal: 14,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    marginRight: 8,
  },
  msgBtnText: { fontSize: 13, fontWeight: '700' },
  kebab: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },

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
