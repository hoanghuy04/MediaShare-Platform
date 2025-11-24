// app/messages/conversation-setting.tsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  ScrollView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { useWebSocket } from '../../context/WebSocketContext';
import { useConversation, useConversationActions } from '../../context/ConversationContext';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
// import { userAPI } from '../../services/api';
import { userService } from '../../services/user.service';
import { messageAPI } from '../../services/message.service';
import { fileService } from '../../services/file.service';
import { mediaService } from '../../services/media';
import { Conversation, UserResponse } from '../../types';
import { showAlert } from '../../utils/helpers';
import { SettingsHeader } from '../../components/messages/settings/SettingsHeader';
import { SettingsTopSection } from '../../components/messages/settings/SettingsTopSection';
import { SettingsQuickActions } from '../../components/messages/settings/SettingsQuickActions';
import { SettingsRow } from '../../components/messages/settings/SettingsRow';
import { SettingsList } from '../../components/messages/settings/SettingsList';
import { SettingsMenuDropdown } from '../../components/messages/settings/SettingsMenuDropdown';
import { SettingsRenameModal } from '../../components/messages/settings/SettingsRenameModal';
import { SettingsEditDropdown } from '../../components/messages/settings/SettingsEditDropdown';
import { SettingsEditGroup } from '../../components/messages/settings/SettingsEditGroup';

export default function ConversationSettingsScreen() {
  const { theme } = useTheme();
  const { user: currentUser } = useAuth();
  const { onConversationUpdate } = useWebSocket();
  const router = useRouter();
  const params = useLocalSearchParams<{ userId?: string; conversationId?: string }>();
  const normalize = (v?: string | string[]) => (Array.isArray(v) ? v[0] : v);
  const routeUserId = normalize(params.userId);
  const routeConversationId = normalize(params.conversationId);

  const [otherUser, setOtherUser] = useState<UserResponse | null>(null);
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
  const editButtonRef = useRef<TouchableOpacity | null>(null);
  const [editMenuVisible, setEditMenuVisible] = useState(false);
  const [editMenuPos, setEditMenuPos] = useState<{ top: number; left: number }>({ top: 120, left: 12 });
  const openEditMenu = () => {
    if (!isGroup) return;
    editButtonRef.current?.measureInWindow?.((x, y, _w, h) => {
      setEditMenuPos({ top: y + h + 8, left: x });
      setEditMenuVisible(true);
    });
  };
  const closeEditMenu = () => setEditMenuVisible(false);

  // Modal đổi tên
  const [renameVisible, setRenameVisible] = useState(false);
  const [renameValue, setRenameValue] = useState('');

  // Action sheet đổi avatar
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);

  // ----- load data -----
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Nếu có routeUserId (direct message không có conversation), load user profile
      if (routeUserId) {
        const profile = await userService.getUserById(routeUserId);
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

  // Listen for real-time conversation updates
  useEffect(() => {
    const unsubscribe = onConversationUpdate((update) => {
      console.log('📡 Conversation update received:', update);
      
      // Only process updates for current conversation
      if (update.conversationId !== routeConversationId) return;

      switch (update.updateType) {
        case 'GROUP_INFO_UPDATED':
          // Refresh conversation data
          if (update.data) {
            setConversation(update.data);
          }
          break;

        case 'MEMBERS_ADDED':
          // Refresh conversation to show new members
          refreshConversation();
          break;

        case 'MEMBER_REMOVED':
          // Check if current user was removed
          if (update.data?.removedUserId === currentUser?.id) {
            showAlert('Thông báo', 'Bạn đã bị xóa khỏi nhóm');
            router.back();
          } else {
            // Refresh to update member list
            refreshConversation();
          }
          break;

        case 'MEMBER_PROMOTED':
        case 'MEMBER_DEMOTED':
          // Refresh to update roles
          refreshConversation();
          break;

        default:
          break;
      }
    });

    return () => {
      unsubscribe();
    };
  }, [routeConversationId, onConversationUpdate, setConversation, refreshConversation, currentUser?.id, router]);

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
              await messageAPI.leaveGroup(conversation.id);
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





  // ----- Quick actions -----
  const isAI =
    otherUser?.username === 'ai-assistant' ||
    otherUser?.username === 'AI Assistant';

  const gradientColors: [string, string, string] = [
    (theme.chat as any).gradientHigh ?? theme.chat.bubbleOut,
    (theme.chat as any).gradientMedium ?? theme.chat.bubbleOut,
    (theme.chat as any).gradientLow ?? theme.chat.bubbleOut,
  ];

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
    try {
      const photo = await mediaService.takePhoto();
      if (photo?.uri) {
        await doUploadAndSetAvatar(photo.uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Lỗi', 'Không thể chụp ảnh. Vui lòng thử lại.');
    }
  }, [doUploadAndSetAvatar]);


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
        <SettingsHeader
          title="Cài đặt cuộc trò chuyện"
          isGroup={isGroup}
          onBack={() => router.back()}
          onAddMember={
            routeConversationId
              ? () => {
                  router.push({
                    pathname: '/messages/group-members',
                    params: { conversationId: routeConversationId, mode: 'add' },
                  });
                }
              : undefined
          }
          textColor={theme.colors.text}
        />
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
        <SettingsHeader
          title="Cài đặt cuộc trò chuyện"
          isGroup={isGroup}
          onBack={() => router.back()}
          onAddMember={
            routeConversationId
              ? () => {
                  router.push({
                    pathname: '/messages/group-members',
                    params: { conversationId: routeConversationId, mode: 'add' },
                  });
                }
              : undefined
          }
          textColor={theme.colors.text}
        />
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <SettingsTopSection
            isGroup={isGroup}
            conversation={conversation}
            otherUser={otherUser}
            themeColors={{
              text: theme.colors.text,
              textSecondary: theme.colors.textSecondary,
              primary: theme.colors.primary,
            }}
            onViewProfile={
              otherUser?.id && otherUser?.username !== 'ai-assistant' && otherUser?.username !== 'AI Assistant'
                ? () => router.push(`/users/${otherUser.id}`)
                : undefined
            }
          />

          <SettingsQuickActions
            isGroup={isGroup}
            isAI={isAI}
            gradientColors={gradientColors}
          onViewProfileOrEditGroup={
            !isGroup
              ? () => otherUser?.id && router.push(`/users/${otherUser.id}`)
              : () => {}
          }
          onOpenEditMenu={openEditMenu}
            onSearch={() => showAlert('Thông báo', 'Tính năng đang phát triển.')}
            onToggleNotification={() => showAlert('Thông báo', 'Tính năng đang phát triển.')}
            onOpenMenu={openMenu}
            menuButtonRef={menuButtonRef}
          editButtonRef={editButtonRef}
            textColor={theme.colors.text}
          />

          <SettingsList
            isGroup={isGroup}
            conversation={conversation}
            otherUser={otherUser}
            themeColors={{
              text: theme.colors.text,
              textSecondary: theme.colors.textSecondary,
            }}
            onOpenThemePicker={() => {
              if (!routeConversationId) return;
              // router.push({
              //   pathname: '/messages/theme-picker',
              //   params: { conversationId: routeConversationId },
              // });
            }}
            onOpenMembers={() => {
              if (!routeConversationId) return;
              router.push({
                pathname: '/messages/group-members',
                params: { conversationId: routeConversationId },
              });
            }}
            onOpenPrivacy={() => {
              router.push({
                pathname: '/messages/privacy-security',
                params: { conversationId: routeConversationId },
              });
            }}
            onCreateGroupFromDirect={() => {
              router.push({
                pathname: '/messages/create-group',
                params: otherUser?.id ? { seedUserId: otherUser.id } : {},
              });
            }}
            onCreateGroupFromGroup={() => {
              router.push({ pathname: '/messages/create-group', params: {} });
            }}
          />

          {/* Nút "Rời khỏi nhóm" dưới cùng (chỉ hiện khi là group) */}
          {isGroup ? (
            <View style={{ paddingTop: 8 }}>
              <SettingsRow
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
                textColor={theme.colors.text}
                textSecondaryColor={theme.colors.textSecondary}
              />
            </View>
          ) : null}
        </ScrollView>

        <SettingsMenuDropdown
          visible={menuVisible}
          position={menuPos}
          isGroup={isGroup}
          onClose={closeMenu}
          onLeaveGroup={handleLeaveGroup}
          onHide={() => showAlert('Thông báo', 'Tính năng đang phát triển')}
          onRestrict={() => showAlert('Thông báo', 'Tính năng đang phát triển')}
          onBlock={() => showAlert('Thông báo', 'Tính năng đang phát triển')}
          onReport={() => showAlert('Thông báo', 'Tính năng đang phát triển')}
          themeColors={{ text: theme.colors.text }}
        />
        <SettingsEditDropdown
          visible={editMenuVisible}
          position={editMenuPos}
          onClose={closeEditMenu}
          onRemove={handleAvatarRemove}
          onRename={() => {
            setRenameValue(conversation?.name || '');
            setRenameVisible(true);
          }}
          onChangeAvatar={() => setAvatarModalVisible(true)}
          themeColors={{ text: theme.colors.text, surface: theme.colors.surface }}
        />

        <SettingsRenameModal
          visible={renameVisible}
          value={renameValue}
          saving={saving}
          onChangeValue={setRenameValue}
          onClear={() => setRenameValue('')}
          onCancel={() => setRenameVisible(false)}
          onSave={handleRenameSave}
        />

        <SettingsEditGroup
          visible={avatarModalVisible}
          onClose={() => setAvatarModalVisible(false)}
          onTakePhoto={() => {
            setAvatarModalVisible(false);
            takePhoto();
          }}
          onPickFromLibrary={() => {
            setAvatarModalVisible(false);
            pickFromLibrary();
          }}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  safeArea: { flex: 1 },
  content: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
