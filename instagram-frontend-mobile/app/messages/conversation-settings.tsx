import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  Image,
  ScrollView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { Avatar } from '../../components/common/Avatar';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { messageAPI, userAPI } from '../../services/api';
import { UserProfile } from '../../types';
import { showAlert } from '../../utils/helpers';

export default function ConversationSettingsScreen() {
  const { theme } = useTheme();
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ userId?: string; conversationId?: string }>();
  const normalizeParam = (value?: string | string[]): string | undefined =>
    Array.isArray(value) ? value[0] : value;
  const routeUserId = normalizeParam(params.userId);
  const routeConversationId = normalizeParam(params.conversationId);
  const [otherUser, setOtherUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleViewProfile = () => {
    if (otherUser?.id) {
      router.push(`/users/${otherUser.id}`);
    } else {
      showAlert('Error', 'Không xác định được người dùng');
    }
  };

  const handleBack = () => {
    router.back();
  };

  useEffect(() => {
    loadUserProfile();
  }, [routeUserId, routeConversationId]);

  const loadUserProfile = async () => {
    try {
      setIsLoading(true);

      if (routeUserId) {
        const profile = await userAPI.getUserProfile(routeUserId);
        setOtherUser(profile);
        return;
      }

      if (routeConversationId) {
        const conversation = await messageAPI.getConversation(routeConversationId);
        const other = conversation.participants?.find(p => p.userId !== currentUser?.id)
                   || conversation.participants?.[0];
        if (!other?.userId) throw new Error('Không tìm thấy participant còn lại');
        const profile = await userAPI.getUserProfile(other.userId);
        setOtherUser(profile);
        return;
      }

      throw new Error('Thiếu userId/conversationId');
    } catch (error: any) {
      console.error('Error loading user profile:', error);
      showAlert('Error', 'Không thể tải thông tin người dùng');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
      </TouchableOpacity>
    </View>
  );

  const renderProfileSection = () => (
    <View style={styles.profileSection}>
      <Avatar 
        uri={otherUser?.profile?.avatar} 
        name={otherUser?.profile?.firstName || otherUser?.username} 
        size={100} 
      />
      <Text style={[styles.profileName, { color: theme.colors.text }]}>
        {otherUser?.profile?.firstName && otherUser?.profile?.lastName 
          ? `${otherUser.profile.firstName} ${otherUser.profile.lastName}`
          : otherUser?.username || 'User'
        }
      </Text>
    </View>
  );

  const renderQuickActions = () => (
    <View style={styles.quickActions}>
      <TouchableOpacity style={styles.quickActionItem} onPress={handleViewProfile}>
        <View style={[styles.quickActionIcon, { backgroundColor: theme.colors.primary }]}>
          <Ionicons name="person-outline" size={20} color="white" />
        </View>
        <Text style={[styles.quickActionText, { color: theme.colors.text }]}>
          Trang cá nhân
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.quickActionItem}
      >
        <View style={[styles.quickActionIcon, { backgroundColor: theme.colors.primary }]}>
          <Ionicons name="search-outline" size={20} color="white" />
        </View>
        <Text style={[styles.quickActionText, { color: theme.colors.text }]}>
          Tìm kiếm
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.quickActionItem}
      >
        <View style={[styles.quickActionIcon, { backgroundColor: theme.colors.primary }]}>
          <Ionicons name="notifications-off-outline" size={20} color="white" />
        </View>
        <Text style={[styles.quickActionText, { color: theme.colors.text }]}>
          Tắt thông báo
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.quickActionItem}
      >
        <View style={[styles.quickActionIcon, { backgroundColor: theme.colors.primary }]}>
          <Ionicons name="ellipsis-horizontal-outline" size={20} color="white" />
        </View>
        <Text style={[styles.quickActionText, { color: theme.colors.text }]}>
          Lựa chọn
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderSettingsList = () => (
    <View style={styles.settingsList}>
      {/* Theme */}
      <TouchableOpacity 
        style={styles.settingItem}
      >
        <View style={styles.settingIcon}>
          <View style={[styles.themeIcon, { backgroundColor: '#8B5CF6' }]} />
        </View>
        <View style={styles.settingContent}>
          <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
            Chủ đề
          </Text>
          <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>
            Mặc định
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
      </TouchableOpacity>

      {/* Disappearing Messages */}
      <TouchableOpacity 
        style={styles.settingItem}
      >
        <View style={styles.settingIcon}>
          <Ionicons name="time-outline" size={24} color={theme.colors.text} />
        </View>
        <View style={styles.settingContent}>
          <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
            Tin nhắn tự hủy
          </Text>
          <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>
            Đang tắt
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
      </TouchableOpacity>

      {/* Privacy and Security */}
      <TouchableOpacity 
        style={styles.settingItem}
      >
        <View style={styles.settingIcon}>
          <Ionicons name="lock-closed-outline" size={24} color={theme.colors.text} />
        </View>
        <View style={styles.settingContent}>
          <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
            Quyền riêng tư và an toàn
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
      </TouchableOpacity>

      {/* Nickname */}
      <TouchableOpacity 
        style={styles.settingItem}
      >
        <View style={styles.settingIcon}>
          <Ionicons name="chatbubbles-outline" size={24} color={theme.colors.text} />
        </View>
        <View style={styles.settingContent}>
          <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
            Biệt danh
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
      </TouchableOpacity>

      {/* Create Group Chat */}
      <TouchableOpacity 
        style={styles.settingItem}
        onPress={() => {
          // Navigate to create-group with current otherUser.id if available
          router.push({
            pathname: '/messages/create-group',
            params: otherUser?.id ? { userId: otherUser.id } : {},
          });
        }}
      >
        <View style={styles.settingIcon}>
          <Ionicons name="people-outline" size={24} color={theme.colors.text} />
        </View>
        <View style={styles.settingContent}>
          <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
            Tạo nhóm chat
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatusBar barStyle="dark-content" backgroundColor="white" />
        <SafeAreaView style={styles.safeArea}>
          {renderHeader()}
          <View style={styles.loadingContainer}>
            <LoadingSpinner />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (!otherUser) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatusBar barStyle="dark-content" backgroundColor="white" />
        <SafeAreaView style={styles.safeArea}>
          {renderHeader()}
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: theme.colors.text }]}>
              Không thể tải thông tin người dùng
            </Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      <SafeAreaView style={styles.safeArea}>
        {renderHeader()}
        
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {renderProfileSection()}
          {renderQuickActions()}
          {renderSettingsList()}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  quickActionItem: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  settingsList: {
    paddingTop: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
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
  themeIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    margin: 20,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    maxWidth: '90%',
  },
  closeButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  developmentNotice: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  developmentIcon: {
    marginBottom: 16,
  },
  developmentTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  developmentMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
