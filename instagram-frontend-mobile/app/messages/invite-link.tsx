import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  Share,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { messageAPI, InviteLinkResponse } from '../../services/message.service';
import { showAlert } from '../../utils/helpers';
// Note: For clipboard functionality, install expo-clipboard: npx expo install expo-clipboard
// For now, using Share API as fallback

export default function InviteLinkScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const params = useLocalSearchParams<{ conversationId: string }>();
  const conversationId = Array.isArray(params.conversationId)
    ? params.conversationId[0]
    : params.conversationId;

  const [inviteLink, setInviteLink] = useState<InviteLinkResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [revoking, setRevoking] = useState(false);

  const loadInviteLink = useCallback(async () => {
    if (!conversationId) return;
    try {
      setLoading(true);
      const link = await messageAPI.getInviteLink(conversationId);
      setInviteLink(link);
    } catch (error: any) {
      console.error('Error loading invite link:', error);
      showAlert('Lỗi', error?.response?.data?.message || 'Không thể tải liên kết mời');
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    loadInviteLink();
  }, [loadInviteLink]);

  const handleCreateOrRotate = useCallback(async () => {
    if (!conversationId) return;
    try {
      setCreating(true);
      const newLink = await messageAPI.createOrRotateInviteLink(conversationId);
      setInviteLink(newLink);
      showAlert('Thành công', 'Liên kết mời đã được tạo');
    } catch (error: any) {
      console.error('Error creating invite link:', error);
      showAlert('Lỗi', error?.response?.data?.message || 'Không thể tạo liên kết mời');
    } finally {
      setCreating(false);
    }
  }, [conversationId]);

  const handleCopyLink = useCallback(async () => {
    if (!inviteLink?.url) {
      showAlert('Lưu ý', 'Chưa có liên kết mời. Vui lòng tạo liên kết trước.');
      return;
    }
    // Using Share API as clipboard alternative
    // To enable clipboard: install expo-clipboard and use Clipboard.setStringAsync()
    try {
      await Share.share({
        message: inviteLink.url,
        title: 'Liên kết mời',
      });
    } catch (error: any) {
      if (error.message !== 'User did not share') {
        console.error('Error sharing link:', error);
        showAlert('Lỗi', 'Không thể sao chép liên kết');
      }
    }
  }, [inviteLink]);

  const handleShareLink = useCallback(async () => {
    if (!inviteLink?.url) {
      showAlert('Lưu ý', 'Chưa có liên kết mời. Vui lòng tạo liên kết trước.');
      return;
    }
    try {
      await Share.share({
        message: inviteLink.url,
        url: inviteLink.url,
        title: 'Liên kết mời tham gia nhóm',
      });
    } catch (error: any) {
      if (error.message !== 'User did not share') {
        console.error('Error sharing link:', error);
        showAlert('Lỗi', 'Không thể chia sẻ liên kết');
      }
    }
  }, [inviteLink]);

  const handleRevoke = useCallback(async () => {
    if (!conversationId) return;
    try {
      setRevoking(true);
      await messageAPI.revokeInviteLink(conversationId);
      setInviteLink(null);
      showAlert('Thành công', 'Liên kết mời đã bị vô hiệu hóa');
    } catch (error: any) {
      console.error('Error revoking invite link:', error);
      showAlert('Lỗi', error?.response?.data?.message || 'Không thể vô hiệu hóa liên kết');
    } finally {
      setRevoking(false);
    }
  }, [conversationId]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Liên kết mời</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <LoadingSpinner />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Liên kết mời</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Link Section with Toggle */}
        <View style={styles.linkSection}>
          <Text style={[styles.linkLabel, { color: theme.colors.text }]}>Liên kết mời</Text>

          {inviteLink ? (
            <View style={styles.linkRow}>
              <Text style={[styles.linkText, { color: '#0095F6' }]} numberOfLines={1}>
                {inviteLink.url}
              </Text>
              <Switch
                value={inviteLink.active ?? true}
                onValueChange={async (value) => {
                  try {
                    const updatedLink = await messageAPI.updateInviteLinkActive(conversationId!, value);
                    setInviteLink(updatedLink);
                  } catch (error: any) {
                    console.error('Error updating invite link active status:', error);
                    showAlert('Lỗi', error?.response?.data?.message || 'Không thể cập nhật trạng thái liên kết');
                  }
                }}
                trackColor={{ false: '#767577', true: '#000' }}
                thumbColor={inviteLink.active ? '#fff' : '#f4f3f4'}
              />
            </View>
          ) : (
            <View style={styles.linkRow}>
              <Text style={[styles.linkText, { color: theme.colors.textSecondary }]}>
                Chưa có liên kết
              </Text>
              <Switch
                value={false}
                onValueChange={async (value) => {
                  if (value) {
                    await handleCreateOrRotate();
                  }
                }}
                trackColor={{ false: '#767577', true: '#000' }}
                thumbColor="#f4f3f4"
              />
            </View>
          )}

          <Text style={[styles.descriptionText, { color: theme.colors.textSecondary }]}>
            Bất kỳ ai cũng có thể tham gia nhóm chat của bạn bằng liên kết này.{' '}
            <Text
              style={[styles.learnMoreText, { color: '#0095F6' }]}
              onPress={() => showAlert('Thông tin', 'Liên kết mời cho phép bất kỳ ai có link đều có thể tham gia nhóm. Bạn có thể tắt hoặc đặt lại liên kết bất cứ lúc nào.')}
            >
              Tìm hiểu thêm
            </Text>
          </Text>
        </View>

        {/* Action Items */}
        <View style={styles.actionsList}>
          <TouchableOpacity
            style={styles.actionItem}
            onPress={handleCopyLink}
          >
            <Ionicons name="document-text-outline" size={24} color={theme.colors.text} />
            <Text style={[styles.actionText, { color: theme.colors.text }]}>Sao chép</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={handleShareLink}
          >
            <Ionicons name="paper-plane-outline" size={24} color={theme.colors.text} />
            <Text style={[styles.actionText, { color: theme.colors.text }]}>Gửi qua Instagram</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => showAlert('Thông báo', 'Tính năng QR Code đang phát triển')}
          >
            <Ionicons name="qr-code-outline" size={24} color={theme.colors.text} />
            <Text style={[styles.actionText, { color: theme.colors.text }]}>Mã QR</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={handleShareLink}
          >
            <Ionicons name="share-outline" size={24} color={theme.colors.text} />
            <Text style={[styles.actionText, { color: theme.colors.text }]}>Chia sẻ</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={handleCreateOrRotate}
            disabled={creating}
          >
            <Ionicons name="refresh-outline" size={24} color="#ef4444" />
            <Text style={[styles.actionText, { color: '#ef4444' }]}>Đặt lại liên kết</Text>
          </TouchableOpacity>
        </View>

        {/* Create Link Button if no link exists */}
        {!inviteLink && (
          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleCreateOrRotate}
            disabled={creating}
          >
            {creating ? (
              <LoadingSpinner size="small" />
            ) : (
              <Text style={styles.createButtonText}>Tạo liên kết mời</Text>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  linkSection: {
    marginBottom: 24,
  },
  linkLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  linkText: {
    fontSize: 15,
    flex: 1,
    marginRight: 12,
  },
  descriptionText: {
    fontSize: 13,
    lineHeight: 18,
  },
  learnMoreText: {
    fontSize: 13,
  },
  actionsList: {
    marginTop: 8,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  actionText: {
    fontSize: 16,
    marginLeft: 16,
  },
  createButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

