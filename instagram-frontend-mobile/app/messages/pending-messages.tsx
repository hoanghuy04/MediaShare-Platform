import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { messageRequestAPI } from '../../services/api';
import { MessageRequest } from '../../types/message';
import { Avatar } from '../../components/common/Avatar';
import { showAlert } from '../../utils/helpers';

export default function PendingMessagesScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<MessageRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadPendingRequests();
  }, []);

  const loadPendingRequests = async () => {
    try {
      setIsLoading(true);
      const data = await messageRequestAPI.getPendingRequests();
      setRequests(data);
    } catch (error: any) {
      console.error('Error loading pending requests:', error);
      showAlert('Lỗi', 'Không thể tải tin nhắn đang chờ');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadPendingRequests();
    setIsRefreshing(false);
  };

  const handleAccept = async (requestId: string) => {
    try {
      const conversation = await messageRequestAPI.acceptRequest(requestId);
      showAlert('Thành công', 'Đã chấp nhận tin nhắn');
      
      // Remove from list
      setRequests(prev => prev.filter(r => r.id !== requestId));
      
      // Navigate to conversation
      router.push(`/messages/${conversation.id}`);
    } catch (error: any) {
      console.error('Error accepting request:', error);
      showAlert('Lỗi', 'Không thể chấp nhận tin nhắn');
    }
  };

  const handleReject = async (requestId: string) => {
    Alert.alert(
      'Từ chối tin nhắn',
      'Bạn có chắc muốn từ chối tin nhắn này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Từ chối',
          style: 'destructive',
          onPress: async () => {
            try {
              await messageRequestAPI.rejectRequest(requestId);
              showAlert('Đã từ chối', 'Tin nhắn đã bị từ chối');
              setRequests(prev => prev.filter(r => r.id !== requestId));
            } catch (error: any) {
              console.error('Error rejecting request:', error);
              showAlert('Lỗi', 'Không thể từ chối tin nhắn');
            }
          },
        },
      ]
    );
  };

  const handleIgnore = async (requestId: string) => {
    try {
      await messageRequestAPI.ignoreRequest(requestId);
      setRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (error: any) {
      console.error('Error ignoring request:', error);
      showAlert('Lỗi', 'Không thể bỏ qua tin nhắn');
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
        Tin nhắn đang chờ
      </Text>
      <View style={styles.placeholder} />
    </View>
  );

  const renderRequestItem = ({ item }: { item: MessageRequest }) => (
    <View style={styles.requestItem}>
      <Avatar
        uri={item.sender.avatar}
        name={item.sender.username}
        size={56}
      />
      
      <View style={styles.requestContent}>
        <View style={styles.requestHeader}>
          <Text style={[styles.username, { color: theme.colors.text }]}>
            {item.sender.username}
          </Text>
          {item.sender.isVerified && (
            <Ionicons name="checkmark-circle" size={16} color="#1DA1F2" />
          )}
        </View>
        
        {item.firstMessage && (
          <Text
            style={[styles.messagePreview, { color: theme.colors.textSecondary }]}
            numberOfLines={2}
          >
            {item.firstMessage.content}
          </Text>
        )}
        
        {item.pendingCount > 1 && (
          <Text style={[styles.pendingCount, { color: theme.colors.textSecondary }]}>
            {item.pendingCount} tin nhắn
          </Text>
        )}
        
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton]}
            onPress={() => handleAccept(item.id)}
          >
            <Text style={styles.acceptButtonText}>Chấp nhận</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => handleReject(item.id)}
          >
            <Text style={[styles.rejectButtonText, { color: theme.colors.text }]}>
              Từ chối
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="mail-open-outline"
        size={64}
        color={theme.colors.textSecondary}
      />
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
        Không có tin nhắn đang chờ
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
        Tin nhắn từ người không theo dõi bạn sẽ xuất hiện ở đây
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatusBar barStyle="dark-content" backgroundColor="white" />
        <SafeAreaView style={styles.safeArea}>
          {renderHeader()}
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
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
        
        <FlatList
          data={requests}
          renderItem={renderRequestItem}
          keyExtractor={(item) => item.id}
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyState}
          ItemSeparatorComponent={() => (
            <View style={[styles.separator, { backgroundColor: theme.colors.border }]} />
          )}
        />
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    flexGrow: 1,
  },
  requestItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
  },
  requestContent: {
    flex: 1,
    marginLeft: 12,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 4,
  },
  messagePreview: {
    fontSize: 14,
    marginBottom: 4,
    lineHeight: 20,
  },
  pendingCount: {
    fontSize: 12,
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButton: {
    backgroundColor: '#0095F6',
  },
  acceptButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  rejectButton: {
    backgroundColor: '#f0f0f0',
  },
  rejectButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});