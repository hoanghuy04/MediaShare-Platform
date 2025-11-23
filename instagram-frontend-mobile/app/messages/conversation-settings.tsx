// app/messages/conversation-setting.tsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Modal,
  Platform,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { useConversation, useConversationActions } from '../../context/ConversationContext';
import { Avatar } from '../../components/common/Avatar';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { userAPI } from '../../services/api';
import { messageAPI } from '../../services/message.service';
import { fileService } from '../../services/file.service';
import { Conversation, UserProfile } from '../../types';
import { showAlert } from '../../utils/helpers';
import { LinearGradient } from 'expo-linear-gradient';

export default function ConversationSettingsScreen() {
  const { theme } = useTheme();
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ userId?: string; conversationId?: string }>();
  const normalize = (v?: string | string[]) => (Array.isArray(v) ? v[0] : v);
  const routeUserId = normalize(params.userId);
  const routeConversationId = normalize(params.conversationId);

  const [otherUser, setOtherUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ConversationContext
  const {
    conversation,
    status: conversationStatus,
    loading: conversationLoading,
    refresh: refreshConversation,
  } = useConversation(routeConversationId);
  const { setConversation, updateConversationLocal } = useConversationActions();

  const isGroup = useMemo(() => conversation?.type === 'GROUP', [conversation?.type]);

  // Dropdown (menu Lựa chọn)
  const menuButtonRef = useRef<TouchableOpacity | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number }>({ top: 120, right: 12 });
  const openMenu = () => {
    menuButtonRef.current?.measureInWindow?.((_x, y, _w, h) => {
      setMenuPos({ top: y + h + 8, right: 12 });
      setMenuVisible(true);
    });
  };
  const closeMenu = () => setMenuVisible(false);

  // Action sheet chỉnh sửa nhóm (Đổi tên / Đổi avatar)
  const [actionSheetVisible, setActionSheetVisible] = useState(false);

  // Modal đổi tên
  const [renameVisible, setRenameVisible] = useState(false);
  const [renameValue, setRenameValue] = useState('');

  // Action sheet đổi avatar
  const [avatarSheetVisible, setAvatarSheetVisible] = useState(false);

  // ----- load data -----
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Nếu có routeUserId (direct message không có conversation), load user profile
      if (routeUserId) {
        const profile = await userAPI.getUserProfile(routeUserId);
        setOtherUser(profile);
        return;
      }

      // Nếu không có routeConversationId thì lỗi
      if (!routeConversationId) {
        throw new Error('Thiếu userId/conversationId');
      }

      // Conversation sẽ được load bởi useConversation hook
      // Chỉ cần đợi conversation load xong rồi load otherUser nếu là DIRECT
    } catch (e) {
      console.error('load settings error', e);
      showAlert('Error', 'Không thể tải cài đặt cuộc trò chuyện');
      router.back();
    } finally {
      setIsLoading(false);
    }
  }, [routeConversationId, routeUserId, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ----- LEAVE GROUP -----
  const handleLeaveGroup = useCallback(() => {
    if (!conversation?.id || !currentUser?.id) return;

    Alert.alert(
      'Rời khỏi nhóm',
      'Bạn có chắc muốn rời khỏi nhóm này?',
      [
        { text: 'Huỷ', style: 'cancel' },
        {
          text: 'Rời nhóm',
          style: 'destructive',
          onPress: async () => {
            try {
              await messageAPI.leaveGroup(conversation.id, currentUser.id);
              showAlert('Thành công', 'Bạn đã rời nhóm');
              router.back();
            } catch (e: any) {
              showAlert('Lỗi', e?.response?.data?.message || 'Không thể rời nhóm');
            }
          },
        },
      ],
      { cancelable: true },
    );
  }, [conversation?.id, currentUser?.id, router]);

  // ----- Header -----
  const Header = (
    <View style={styles.header}>
      <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
      </TouchableOpacity>

      <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
        Cài đặt cuộc trò chuyện
      </Text>

      {isGroup ? (
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => {
            if (!routeConversationId) return;
            router.push({
              pathname: '/messages/group-members',
              params: { conversationId: routeConversationId, mode: 'add' },
            });
          }}
        >
          <Ionicons name="person-add-outline" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      ) : (
        <View style={styles.headerBtn} />
      )}
    </View>
  );

  // ----- Top section -----
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
          {otherUser?.username !== 'ai-assistant' && otherUser?.username !== 'AI Assistant' ? (
            <TouchableOpacity
              onPress={() => otherUser?.id && router.push(`/users/${otherUser.id}`)}
            >
              <Text style={[styles.linkAction, { color: theme.colors.primary }]}>
                Xem trang cá nhân
              </Text>
            </TouchableOpacity>
          ) : (
            <Text
              style={[
                styles.settingSubtitle,
                { color: theme.colors.textSecondary, marginTop: 6 },
              ]}
            >
              Dùng Openai 3.5
            </Text>
          )}
        </View>
      );
    }

    return (
      <View style={styles.profileSection}>
        <Avatar
          uri={(conversation as any)?.avatar}
          name={conversation?.name || 'Nhóm chat'}
          size={100}
        />
        <Text style={[styles.titleName, { color: theme.colors.text }]}>
          {conversation?.name || 'Nhóm chat'}
        </Text>
      </View>
    );
  })();

  // ----- Setting row -----
  const SettingRow = ({
    left,
    title,
    subtitle,
    onPress,
    danger = false,
    showChevron = true,
  }: {
    left: React.ReactNode;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    danger?: boolean;
    showChevron?: boolean;
  }) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      activeOpacity={onPress ? 0.8 : 1}
    >
      <View style={styles.settingIcon}>{left}</View>
      <View style={styles.settingContent}>
        <Text
          style={[
            styles.settingTitle,
            { color: danger ? '#ef4444' : theme.colors.text },
          ]}
        >
          {title}
        </Text>
        {!!subtitle && (
          <Text
            style={[
              styles.settingSubtitle,
              { color: theme.colors.textSecondary },
            ]}
          >
            {subtitle}
          </Text>
        )}
      </View>
      {showChevron && (
        <Ionicons
          name="chevron-forward"
          size={16}
          color={theme.colors.textSecondary}
        />
      )}
    </TouchableOpacity>
  );

  // ----- Rows -----
  const ThemeRow = (
    <SettingRow
      left={
        <View
          style={[
            styles.themeDot,
            { backgroundColor: (conversation as any)?.theme?.tint || '#8B5CF6' },
          ]}
        />
      }
      title="Chủ đề"
      subtitle={
        (conversation as any)?.theme?.themeKey
          ? (conversation as any).theme.themeKey
          : 'Mặc định'
      }
      onPress={() => {
        if (!routeConversationId) return;
        router.push({
          pathname: '/messages/theme-picker',
          params: { conversationId: routeConversationId },
        });
      }}
    />
  );

  const SelfDestructRow = (
    <SettingRow
      left={<Ionicons name="time-outline" size={24} color={theme.colors.text} />}
      title="Tin nhắn tự hủy"
      subtitle="Đang tắt"
    />
  );

  const InviteLinkRow = isGroup ? (
    <SettingRow
      left={<Ionicons name="link-outline" size={24} color={theme.colors.text} />}
      title="Liên kết mời"
      subtitle={(conversation as any)?.inviteLink || 'Tạo liên kết mời'}
    />
  ) : null;

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
    />
  );

  const NicknameRow = (
    <SettingRow
      left={<Ionicons name="person-circle-outline" size={24} color={theme.colors.text} />}
      title="Biệt danh"
    />
  );

  const CreateGroupFromDirectRow =
    !isGroup && otherUser?.username !== 'ai-assistant' && otherUser?.username !== 'AI Assistant'
      ? (
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
      )
      : null;

  const CreateGroupFromGroupRow = isGroup ? (
    <SettingRow
      left={<Ionicons name="people-outline" size={24} color={theme.colors.text} />}
      title="Tạo nhóm chat mới"
      onPress={() => {
        router.push({ pathname: '/messages/create-group', params: {} });
      }}
    />
  ) : null;

  // ----- Quick actions -----
  const isAI =
    otherUser?.username === 'ai-assistant' ||
    otherUser?.username === 'AI Assistant';

  const gradientColors = [
    (theme.chat as any).gradientHigh ?? theme.chat.bubbleOut,
    (theme.chat as any).gradientMedium ?? theme.chat.bubbleOut,
    (theme.chat as any).gradientLow ?? theme.chat.bubbleOut,
  ];

  const ViewProfileQuick = !isGroup ? (
    <TouchableOpacity
      style={styles.quickActionItem}
      onPress={() => otherUser?.id && router.push(`/users/${otherUser.id}`)}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.quickActionIcon}
      >
        <Ionicons name="person-outline" size={20} color="white" />
      </LinearGradient>
      <Text style={[styles.quickActionText, { color: theme.colors.text }]}>
        Trang cá nhân
      </Text>
    </TouchableOpacity>
  ) : (
    <TouchableOpacity
      style={styles.quickActionItem}
      onPress={() => {
        setRenameValue(conversation?.name || '');
        setActionSheetVisible(true);
      }}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.quickActionIcon}
      >
        <Ionicons name="pencil-outline" size={20} color="white" />
      </LinearGradient>
      <Text style={[styles.quickActionText, { color: theme.colors.text }]}>
        Chỉnh sửa nhóm
      </Text>
    </TouchableOpacity>
  );

  const QuickActions = (
    <View style={styles.quickActions}>
      {ViewProfileQuick}

      {/* Tìm kiếm */}
      <TouchableOpacity
        style={styles.quickActionItem}
        onPress={() => showAlert('Thông báo', 'Tính năng đang phát triển.')}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.quickActionIcon}
        >
          <Ionicons name="search-outline" size={20} color="white" />
        </LinearGradient>
        <Text style={[styles.quickActionText, { color: theme.colors.text }]}>
          Tìm kiếm
        </Text>
      </TouchableOpacity>

      {/* Tắt thông báo */}
      <TouchableOpacity
        style={styles.quickActionItem}
        onPress={() => showAlert('Thông báo', 'Tính năng đang phát triển.')}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.quickActionIcon}
        >
          <Ionicons name="notifications-off-outline" size={20} color="white" />
        </LinearGradient>
        <Text style={[styles.quickActionText, { color: theme.colors.text }]}>
          Tắt thông báo
        </Text>
      </TouchableOpacity>

      {/* Lựa chọn (ẩn nếu AI) */}
      {!isAI && (
        <TouchableOpacity
          ref={menuButtonRef}
          style={styles.quickActionItem}
          onPress={openMenu}
        >
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.quickActionIcon}
          >
            <Ionicons
              name="ellipsis-horizontal-outline"
              size={20}
              color="white"
            />
          </LinearGradient>
          <Text style={[styles.quickActionText, { color: theme.colors.text }]}>
            Lựa chọn
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // ----- Handlers: Rename -----
  const handleRenameSave = useCallback(async () => {
    if (!routeConversationId) return;
    const trimmed = renameValue.trim();
    if (!trimmed) {
      Alert.alert('Lưu ý', 'Tên nhóm không được để trống.');
      return;
    }
    try {
      setSaving(true);
      const updated = await messageAPI.updateConversation(routeConversationId, { name: trimmed });
      setConversation(updated);
      setRenameVisible(false);
      setActionSheetVisible(false);
    } catch (e: any) {
      console.error(e);
      Alert.alert('Lỗi', e?.response?.data?.message || 'Không thể đổi tên nhóm');
    } finally {
      setSaving(false);
    }
  }, [routeConversationId, renameValue, setConversation]);

  // ----- Handlers: Avatar -----
  const doUploadAndSetAvatar = useCallback(
    async (localUri: string) => {
      if (!routeConversationId) return;
      const form = new FormData();
      const fileName = localUri.split('/').pop() || `avatar_${Date.now()}.jpg`;
      const mime = 'image/jpeg';

      form.append('file', {
        uri: Platform.select({
          ios: localUri.replace('file://', ''),
          android: localUri,
        }) as string,
        name: fileName,
        type: mime,
      } as any);

      setSaving(true);
      try {
        const uploaded = await fileService.uploadFile(form, 'PROFILE');
        const updated = await messageAPI.updateConversation(routeConversationId, { avatar: uploaded.id });
        setConversation(updated);
        setAvatarSheetVisible(false);
        setActionSheetVisible(false);
      } catch (e: any) {
        console.error(e);
        Alert.alert('Lỗi', e?.response?.data?.message || 'Không thể đổi ảnh nhóm');
      } finally {
        setSaving(false);
      }
    },
    [routeConversationId, setConversation],
  );

  const handleAvatarRemove = useCallback(async () => {
    if (!routeConversationId) return;
    try {
      setSaving(true);
      const updated = await messageAPI.updateConversation(routeConversationId, { avatar: '__REMOVE__' });
      setConversation(updated);
      setAvatarSheetVisible(false);
      setActionSheetVisible(false);
    } catch (e: any) {
      console.error(e);
      Alert.alert('Lỗi', e?.response?.data?.message || 'Không thể gỡ ảnh nhóm');
    } finally {
      setSaving(false);
    }
  }, [routeConversationId, setConversation]);

  const pickFromLibrary = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Quyền truy cập', 'Vui lòng cho phép truy cập Thư viện ảnh.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!res.canceled) {
      await doUploadAndSetAvatar(res.assets[0].uri);
    }
  }, [doUploadAndSetAvatar]);

  const takePhoto = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Quyền truy cập', 'Vui lòng cho phép dùng Camera.');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      quality: 0.9,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!res.canceled) {
      await doUploadAndSetAvatar(res.assets[0].uri);
    }
  }, [doUploadAndSetAvatar]);

  // ----- Menu Lựa chọn (dropdown) -----
  const Menu = (
    <Modal
      transparent
      visible={menuVisible}
      animationType="fade"
      onRequestClose={closeMenu}
    >
      <View style={styles.menuOverlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject as any}
          onPress={closeMenu}
        />
        <View
          style={[
            styles.menuCard,
            { top: menuPos.top, right: menuPos.right },
          ]}
        >
          {isGroup ? (
            <>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  closeMenu();
                  handleLeaveGroup();
                }}
              >
                <Ionicons
                  name="exit-outline"
                  size={20}
                  color="#ef4444"
                  style={{ marginRight: 10 }}
                />
                <Text
                  style={[
                    styles.menuItemText,
                    { color: '#ef4444' },
                  ]}
                >
                  Rời khỏi nhóm
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  closeMenu();
                  showAlert('Thông báo', 'Tính năng đang phát triển');
                }}
              >
                <Ionicons
                  name="eye-off-outline"
                  size={20}
                  color={theme.colors.text}
                  style={{ marginRight: 10 }}
                />
                <Text
                  style={[
                    styles.menuItemText,
                    { color: theme.colors.text },
                  ]}
                >
                  Ẩn
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  closeMenu();
                  showAlert('Thông báo', 'Tính năng đang phát triển');
                }}
              >
                <Ionicons
                  name="shield-half-outline"
                  size={20}
                  color={theme.colors.text}
                  style={{ marginRight: 10 }}
                />
                <Text
                  style={[
                    styles.menuItemText,
                    { color: theme.colors.text },
                  ]}
                >
                  Hạn chế
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                closeMenu();
                showAlert('Thông báo', 'Tính năng đang phát triển');
              }}
            >
              <Ionicons
                name="shield-half-outline"
                size={20}
                color={theme.colors.text}
                style={{ marginRight: 10 }}
              />
              <Text
                style={[
                  styles.menuItemText,
                  { color: theme.colors.text },
                ]}
              >
                Hạn chế
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              closeMenu();
              showAlert('Thông báo', 'Tính năng đang phát triển');
            }}
          >
            <Ionicons
              name="close-circle-outline"
              size={20}
              color="#ef4444"
              style={{ marginRight: 10 }}
            />
            <Text
              style={[
                styles.menuItemText,
                { color: '#ef4444' },
              ]}
            >
              Chặn
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              closeMenu();
              showAlert('Thông báo', 'Tính năng đang phát triển');
            }}
          >
            <Ionicons
              name="alert-circle-outline"
              size={20}
              color="#ef4444"
              style={{ marginRight: 10 }}
            />
            <Text
              style={[
                styles.menuItemText,
                { color: '#ef4444' },
              ]}
            >
              Báo cáo
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // ----- Action sheet 2 lựa chọn (Đổi tên / Đổi avatar) -----
  const EditActionSheet = (
    <Modal
      transparent
      visible={actionSheetVisible}
      animationType="fade"
      onRequestClose={() => setActionSheetVisible(false)}
    >
      <TouchableOpacity
        style={styles.sheetOverlay}
        onPress={() => setActionSheetVisible(false)}
      />
      <View style={styles.sheetCard}>
        <TouchableOpacity
          style={styles.sheetItem}
          onPress={() => {
            setActionSheetVisible(false);
            setRenameVisible(true);
          }}
        >
          <Text style={styles.sheetItemText}>Đổi tên</Text>
        </TouchableOpacity>
        <View style={styles.sheetDivider} />
        <TouchableOpacity
          style={styles.sheetItem}
          onPress={() => {
            setActionSheetVisible(false);
            setAvatarSheetVisible(true);
          }}
        >
          <Text style={styles.sheetItemText}>Đổi avatar</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );

  // ----- Rename modal -----
  const RenameModal = (
    <Modal
      transparent
      visible={renameVisible}
      animationType="fade"
      onRequestClose={() => setRenameVisible(false)}
    >
      <View style={styles.centerOverlay}>
        <View style={styles.renameCard}>
          <Text style={styles.renameHeader}>Chỉnh sửa tên nhóm</Text>
          <View style={styles.renameInputWrap}>
            <TextInput
              value={renameValue}
              onChangeText={setRenameValue}
              placeholder="Nhập tên nhóm"
              style={styles.renameInput}
            />
          </View>

          <View style={styles.renameFooter}>
            <TouchableOpacity onPress={() => setRenameValue('')}>
              <Text style={[styles.renameLeft, { color: '#ef4444' }]}>Gỡ</Text>
            </TouchableOpacity>

            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity
                style={{ marginRight: 18 }}
                onPress={() => setRenameVisible(false)}
              >
                <Text style={{ fontWeight: '600' }}>Huỷ</Text>
              </TouchableOpacity>
              <TouchableOpacity disabled={saving} onPress={handleRenameSave}>
                <Text style={{ color: '#0A84FF', fontWeight: '700' }}>
                  {saving ? 'Đang lưu…' : 'Lưu'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );

  // ----- Avatar action sheet (Gỡ / Chụp ảnh / Chọn ảnh) -----
  const AvatarSheet = (
    <Modal
      transparent
      visible={avatarSheetVisible}
      animationType="fade"
      onRequestClose={() => setAvatarSheetVisible(false)}
    >
      <TouchableOpacity
        style={styles.sheetOverlay}
        onPress={() => setAvatarSheetVisible(false)}
      />
      <View style={styles.sheetCard}>
        <TouchableOpacity style={styles.sheetItem} onPress={handleAvatarRemove}>
          <Text style={[styles.sheetItemText, { color: '#ef4444' }]}>
            {saving ? 'Đang gỡ…' : 'Gỡ'}
          </Text>
        </TouchableOpacity>
        <View style={styles.sheetDivider} />
        <TouchableOpacity style={styles.sheetItem} onPress={takePhoto}>
          <Text style={styles.sheetItemText}>Chụp ảnh</Text>
        </TouchableOpacity>
        <View style={styles.sheetDivider} />
        <TouchableOpacity style={styles.sheetItem} onPress={pickFromLibrary}>
          <Text style={styles.sheetItemText}>Chọn ảnh</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );

  if (isLoading) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <StatusBar barStyle="dark-content" backgroundColor="white" />
        <SafeAreaView style={styles.safeArea}>
          {Header}
          <View style={styles.loadingContainer}>
            <LoadingSpinner />
          </View>
        </SafeAreaView>
      </SafeAreaView>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      <SafeAreaView style={styles.safeArea}>
        {Header}
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {TopSection}
          {QuickActions}

          {/* Settings list */}
          <View style={styles.settingsList}>
            {ThemeRow}

            {/* Direct: Tin nhắn tự hủy; Group: Liên kết mời + Mọi người */}
            {!isGroup && SelfDestructRow}
            {InviteLinkRow}
            {MembersRow}

            {PrivacyRow}
            {NicknameRow}

            {CreateGroupFromDirectRow}
            {CreateGroupFromGroupRow}
          </View>

          {/* Nút "Rời khỏi nhóm" dưới cùng (chỉ hiện khi là group) */}
          {isGroup ? (
            <View style={{ paddingTop: 8 }}>
              <SettingRow
                left={
                  <Ionicons
                    name="exit-outline"
                    size={24}
                    color="#ef4444"
                  />
                }
                title="Rời khỏi nhóm"
                onPress={handleLeaveGroup}
                danger
              />
            </View>
          ) : null}
        </ScrollView>

        {Menu}
        {EditActionSheet}
        {RenameModal}
        {AvatarSheet}
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
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
  },

  content: { flex: 1 },

  profileSection: {
    alignItems: 'center',
    paddingTop: 36,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  titleName: {
    fontSize: 24,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  linkAction: { marginTop: 6, fontSize: 14, fontWeight: '600' },

  quickActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  quickActionItem: { alignItems: 'center', flex: 1 },
  quickActionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },

  settingsList: { paddingTop: 16 },

  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  themeDot: { width: 24, height: 24, borderRadius: 12 },

  settingContent: { flex: 1 },
  settingTitle: { fontSize: 16, fontWeight: '500', marginBottom: 2 },
  settingSubtitle: { fontSize: 14 },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Dropdown
  menuOverlay: { flex: 1 },
  menuCard: {
    position: 'absolute',
    borderRadius: 12,
    paddingVertical: 6,
    minWidth: 230,
    backgroundColor: 'white',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 10 },
    }),
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  menuItemText: { fontSize: 15, fontWeight: '700' },

  // Action sheet 2 lựa chọn
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)' },
  sheetCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    backgroundColor: 'white',
    paddingVertical: 8,
  },
  sheetItem: { paddingVertical: 16, paddingHorizontal: 20 },
  sheetItemText: { fontSize: 16, fontWeight: '600' },
  sheetDivider: { height: 1, backgroundColor: '#eee' },

  // Rename modal
  centerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  renameCard: {
    width: '86%',
    backgroundColor: 'white',
    borderRadius: 14,
    paddingTop: 14,
    paddingBottom: 8,
  },
  renameHeader: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
  },
  renameInputWrap: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  renameInput: { fontSize: 16, paddingVertical: 8 },
  renameFooter: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  renameLeft: { fontWeight: '700' },
});
