// conversation-setting.tsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  ScrollView,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { Avatar } from '../../components/common/Avatar';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { messageAPI, userAPI } from '../../services/api';
import { Conversation, UserProfile } from '../../types';
import { showAlert } from '../../utils/helpers';

export default function ConversationSettingsScreen() {
  const { theme } = useTheme();
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ userId?: string; conversationId?: string }>();
  const normalize = (v?: string | string[]) => (Array.isArray(v) ? v[0] : v);
  const routeUserId = normalize(params.userId);
  const routeConversationId = normalize(params.conversationId);

  const [otherUser, setOtherUser] = useState<UserProfile | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isGroup = useMemo(() => conversation?.type === 'GROUP', [conversation?.type]);

  // ----- Dropdown menu state -----
  const menuButtonRef = useRef<TouchableOpacity | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number }>({ top: 120, right: 12 });

  const openMenu = () => {
    // đo toạ độ của nút "Lựa chọn" để đặt menu ngay bên dưới
    menuButtonRef.current?.measureInWindow?.((_x, y, _w, h) => {
      setMenuPos({ top: y + h + 8, right: 12 });
      setMenuVisible(true);
    });
  };
  const closeMenu = () => setMenuVisible(false);

  // -------- data loaders --------
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);

      if (routeConversationId) {
        const conv = await messageAPI.getConversation(routeConversationId);
        setConversation(conv);

        if (conv.type === 'DIRECT') {
          const other =
            conv.participants?.find(p => p.userId !== currentUser?.id) ||
            conv.participants?.[0];
          if (other?.userId) {
            const profile = await userAPI.getUserProfile(other.userId);
            setOtherUser(profile);
          }
        }
        return;
      }

      if (routeUserId) {
        const profile = await userAPI.getUserProfile(routeUserId);
        setOtherUser(profile);
        setConversation(null);
        return;
      }

      throw new Error('Thiếu userId/conversationId');
    } catch (e) {
      console.error('load settings error', e);
      showAlert('Error', 'Không thể tải cài đặt cuộc trò chuyện');
      router.back();
    } finally {
      setIsLoading(false);
    }
  }, [routeConversationId, routeUserId, currentUser?.id, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // -------- header --------
  const Header = (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
      </TouchableOpacity>
    </View>
  );

  // -------- top section --------
  const TopSection = (() => {
    if (!isGroup) {
      return (
        <View style={styles.profileSection}>
          <Avatar
            uri={otherUser?.profile?.avatar}
            name={otherUser?.profile?.firstName || otherUser?.username}
            size={100}
          />
          <Text style={[styles.titleName, { color: theme.colors.text }]}>
            {otherUser?.username || 'User'}
          </Text>
          <TouchableOpacity
            onPress={() => otherUser?.id && router.push(`/users/${otherUser.id}`)}
          >
            <Text style={[styles.linkAction, { color: theme.colors.primary }]}>
              Đổi tên và hình ảnh
            </Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={styles.profileSection}>
        <Avatar uri={conversation?.avatar} name={conversation?.name || 'Nhóm chat'} size={100} />
        <Text style={[styles.titleName, { color: theme.colors.text }]}>
          {conversation?.name || 'Nhóm chat'}
        </Text>
        <TouchableOpacity onPress={() => showAlert('Thông báo', 'Tính năng đang phát triển.')}>
          <Text style={[styles.linkAction, { color: theme.colors.primary }]}>
            Đổi tên và hình ảnh
          </Text>
        </TouchableOpacity>
      </View>
    );
  })();

  // -------- setting row component --------
  const SettingRow = ({
    left,
    title,
    subtitle,
    onPress,
  }: {
    left: React.ReactNode;
    title: string;
    subtitle?: string;
    onPress?: () => void;
  }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.settingIcon}>{left}</View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: theme.colors.text }]}>{title}</Text>
        {!!subtitle && (
          <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>{subtitle}</Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
    </TouchableOpacity>
  );

  const ThemeRow = (
    <SettingRow
      left={<View style={[styles.themeDot, { backgroundColor: conversation?.theme?.tint || '#8B5CF6' }]} />}
      title="Chủ đề"
      subtitle={conversation?.theme?.themeKey ? conversation.theme.themeKey : 'Mặc định'}
      onPress={() => {
        if (!routeConversationId) return;
        router.push({
          pathname: '/messages/theme-picker',
          params: { conversationId: routeConversationId },
        });
      }}
    />
  );

  const MembersRow = isGroup ? (
    <SettingRow
      left={<Ionicons name="people-outline" size={24} color={theme.colors.text} />}
      title="Mọi người"
      subtitle={`${conversation?.participants?.length || 0} thành viên`}
      onPress={() => {
        if (!routeConversationId) return;
        router.push({
          pathname: '/messages/group-members',
          params: { conversationId: routeConversationId },
        });
      }}
    />
  ) : null;

  const PrivacyRow = (
    <SettingRow
      left={<Ionicons name="lock-closed-outline" size={24} color={theme.colors.text} />}
      title="Quyền riêng tư và an toàn"
      onPress={() => showAlert('Thông báo', 'Tính năng đang phát triển.')}
    />
  );

  const MuteRow = (
    <SettingRow
      left={<Ionicons name="notifications-off-outline" size={22} color={theme.colors.text} />}
      title="Tắt thông báo"
      onPress={() => showAlert('Thông báo', 'Tính năng đang phát triển.')}
    />
  );

  const SearchRow = (
    <SettingRow
      left={<Ionicons name="search-outline" size={22} color={theme.colors.text} />}
      title="Tìm kiếm"
      onPress={() => showAlert('Thông báo', 'Tính năng đang phát triển.')}
    />
  );

  const CreateGroupFromDirectRow = !isGroup ? (
    <SettingRow
      left={<Ionicons name="people-outline" size={24} color={theme.colors.text} />}
      title="Tạo nhóm chat mới"
      onPress={() => {
        router.push({
          pathname: '/messages/create-group',
          params: otherUser?.id ? { seedUserId: otherUser.id } : {},
        });
      }}
    />
  ) : null;

  // -------- Quick actions --------
  const ViewProfileQuick = !isGroup ? (
    <TouchableOpacity
      style={styles.quickActionItem}
      onPress={() => otherUser?.id && router.push(`/users/${otherUser.id}`)}
    >
      <View style={[styles.quickActionIcon, { backgroundColor: theme.colors.primary }]}>
        <Ionicons name="person-outline" size={20} color="white" />
      </View>
      <Text style={[styles.quickActionText, { color: theme.colors.text }]}>Trang cá nhân</Text>
    </TouchableOpacity>
  ) : (
    <TouchableOpacity
      style={styles.quickActionItem}
      onPress={() => showAlert('Thông báo', 'Màn sửa thông tin nhóm đang phát triển.')}
    >
      <View style={[styles.quickActionIcon, { backgroundColor: theme.colors.primary }]}>
        <Ionicons name="pencil-outline" size={20} color="white" />
      </View>
      <Text style={[styles.quickActionText, { color: theme.colors.text }]}>Chỉnh sửa nhóm</Text>
    </TouchableOpacity>
  );

  const QuickActions = (
    <View style={styles.quickActions}>
      {ViewProfileQuick}
      <TouchableOpacity style={styles.quickActionItem} onPress={() => showAlert('Thông báo', 'Tính năng đang phát triển.')}>
        <View style={[styles.quickActionIcon, { backgroundColor: theme.colors.primary }]}>
          <Ionicons name="search-outline" size={20} color="white" />
        </View>
        <Text style={[styles.quickActionText, { color: theme.colors.text }]}>Tìm kiếm</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.quickActionItem} onPress={() => showAlert('Thông báo', 'Tính năng đang phát triển.')}>
        <View style={[styles.quickActionIcon, { backgroundColor: theme.colors.primary }]}>
          <Ionicons name="notifications-off-outline" size={20} color="white" />
        </View>
        <Text style={[styles.quickActionText, { color: theme.colors.text }]}>Tắt thông báo</Text>
      </TouchableOpacity>
      {/* Nút Lựa chọn để mở menu dropdown */}
      <TouchableOpacity ref={menuButtonRef} style={styles.quickActionItem} onPress={openMenu}>
        <View style={[styles.quickActionIcon, { backgroundColor: theme.colors.primary }]}>
          <Ionicons name="ellipsis-horizontal-outline" size={20} color="white" />
        </View>
        <Text style={[styles.quickActionText, { color: theme.colors.text }]}>Lựa chọn</Text>
      </TouchableOpacity>
    </View>
  );

  // -------- Menu item component --------
  const MenuItem = ({
    icon,
    label,
    danger,
    onPress,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    danger?: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.85}>
      <Ionicons
        name={icon}
        size={20}
        color={danger ? '#ef4444' : theme.colors.text}
        style={{ marginRight: 10 }}
      />
      <Text style={[styles.menuItemText, { color: danger ? '#ef4444' : theme.colors.text }]}>{label}</Text>
    </TouchableOpacity>
  );

  // -------- Dropdown menu --------
  const Menu = (
    <Modal transparent visible={menuVisible} animationType="fade" onRequestClose={closeMenu}>
      <View style={styles.menuOverlay}>
        {/* chạm nền để đóng */}
        <TouchableOpacity style={StyleSheet.absoluteFillObject as any} onPress={closeMenu} />
        <View style={[styles.menuCard, { top: menuPos.top, right: menuPos.right }]}>
          {isGroup ? (
            <>
              <MenuItem
                icon="exit-outline"
                label="Rời khỏi nhóm"
                danger
                onPress={async () => {
                  closeMenu();
                  try {
                    if (!conversation?.id || !currentUser?.id) return;
                    await messageAPI.leaveGroup(conversation.id, currentUser.id);
                    showAlert('Thành công', 'Bạn đã rời nhóm');
                    router.back();
                  } catch (e: any) {
                    showAlert('Lỗi', e?.response?.data?.message || 'Không thể rời nhóm');
                  }
                }}
              />
              <MenuItem
                icon="eye-off-outline"
                label="Ẩn"
                onPress={() => {
                  closeMenu();
                  showAlert('Thông báo', 'Tính năng đang phát triển');
                }}
              />
              <MenuItem
                icon="shield-half-outline"
                label="Hạn chế"
                onPress={() => {
                  closeMenu();
                  showAlert('Thông báo', 'Tính năng đang phát triển');
                }}
              />
            </>
          ) : (
            // DIRECT: Hạn chế trước
            <MenuItem
              icon="shield-half-outline"
              label="Hạn chế"
              onPress={() => {
                closeMenu();
                showAlert('Thông báo', 'Tính năng đang phát triển');
              }}
            />
          )}

          {/* Chung cho cả 2 */}
          <MenuItem
            icon="close-circle-outline"
            label="Chặn"
            danger
            onPress={() => {
              closeMenu();
              showAlert('Thông báo', 'Tính năng đang phát triển');
            }}
          />
          <MenuItem
            icon="alert-circle-outline"
            label="Báo cáo"
            danger
            onPress={() => {
              closeMenu();
              showAlert('Thông báo', 'Tính năng đang phát triển');
            }}
          />
        </View>
      </View>
    </Modal>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatusBar barStyle="dark-content" backgroundColor="white" />
        <SafeAreaView style={styles.safeArea}>
          {Header}
          <View style={styles.loadingContainer}>
            <LoadingSpinner />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      <SafeAreaView style={styles.safeArea}>
        {Header}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {TopSection}
          {QuickActions}

          {/* Settings list */}
          <View style={styles.settingsList}>
            {ThemeRow}
            {MembersRow}
            {PrivacyRow}
            {MuteRow}
            {SearchRow}
            {CreateGroupFromDirectRow}
          </View>
        </ScrollView>

        {/* Dropdown menu */}
        {Menu}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  safeArea: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: { padding: 4 },

  content: { flex: 1 },

  profileSection: { alignItems: 'center', paddingVertical: 36, paddingHorizontal: 20 },
  titleName: { fontSize: 24, fontWeight: '600', marginTop: 12, textAlign: 'center' },
  linkAction: { marginTop: 6, fontSize: 14, fontWeight: '600' },

  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  quickActionItem: { alignItems: 'center', flex: 1 },
  quickActionIcon: {
    width: 50, height: 50, borderRadius: 25,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  quickActionText: { fontSize: 12, fontWeight: '500', textAlign: 'center' },

  settingsList: { paddingTop: 16 },

  settingItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  settingIcon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  themeDot: { width: 24, height: 24, borderRadius: 12 },

  settingContent: { flex: 1 },
  settingTitle: { fontSize: 16, fontWeight: '500', marginBottom: 2 },
  settingSubtitle: { fontSize: 14 },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Dropdown
  menuOverlay: {
    flex: 1,
  },
  menuCard: {
    position: 'absolute',
    borderRadius: 12,
    paddingVertical: 6,
    minWidth: 230,
    backgroundColor: 'white',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
      android: { elevation: 10 },
    }),
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
