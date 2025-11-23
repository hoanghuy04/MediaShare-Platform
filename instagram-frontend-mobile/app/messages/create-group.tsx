import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { MutualUserPicker, MutualUserOption } from '../../components/messages/MutualUserPicker';
import { showAlert } from '../../utils/helpers';
import { messageAPI } from '../../services/message.service';

export default function CreateGroupScreen() {
  const { theme } = useTheme();
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const currentUserId = currentUser?.id || '';

  const [groupName, setGroupName] = useState('');
  const [isNameDirty, setIsNameDirty] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Record<string, MutualUserOption>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedList = useMemo(() => Object.values(selectedUsers), [selectedUsers]);

  const autoGroupName = useMemo(() => {
    if (selectedList.length === 0) return '';
    const nameList = selectedList.map(item => item.displayName || item.username);
    if (nameList.length === 1) return nameList[0];
    if (nameList.length === 2) return nameList.join(', ');
    return `${nameList[0]}, ${nameList[1]}, +${nameList.length - 2}`;
  }, [selectedList]);

  useEffect(() => {
    if (!isNameDirty) {
      setGroupName(autoGroupName);
    }
  }, [autoGroupName, isNameDirty]);

  const handleNameChange = (value: string) => {
    setGroupName(value);
    setIsNameDirty(value.trim().length > 0);
  };

  const derivedGroupName = useMemo(() => {
    const trimmed = groupName.trim();
    if (trimmed.length > 0) return trimmed;
    if (autoGroupName.trim().length > 0) return autoGroupName.trim();
    if (currentUser?.username) return `Tên nhóm của ${currentUser.username}`;
    return 'Nhóm mới';
  }, [groupName, autoGroupName, currentUser?.username]);

  const selectedCount = selectedList.length;
  const nameValid = derivedGroupName.length >= 1 && derivedGroupName.length <= 100;
  const canCreate = selectedCount >= 2 && nameValid && !isSubmitting;

  const handleCreateGroup = async () => {
    if (!currentUserId) {
      showAlert('Lỗi', 'Không xác định được người dùng hiện tại');
      return;
    }

    if (selectedCount < 2) {
      showAlert('Lỗi', 'Vui lòng chọn tối thiểu 2 thành viên');
      return;
    }

    const participantIds = selectedList.map(user => user.id);
    const finalName = derivedGroupName.substring(0, 100);

    try {
      setIsSubmitting(true);
      const start = Date.now();
      const conversation = await messageAPI.createGroup(finalName, participantIds, null);
      console.log('[telemetry] group_create_success', {
        participantCount: participantIds.length,
        durationMs: Date.now() - start,
      });
      showAlert('Thành công', 'Tạo nhóm thành công');
      router.replace(`/messages/${conversation.id}`);
    } catch (error: any) {
      console.error('Error creating group:', error);
      const message = error?.response?.data?.message || 'Không thể tạo nhóm chat';
      showAlert('Lỗi', message);
      console.log('[telemetry] group_create_error', { message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderHeader = () => (
    <View
      style={[
        styles.header,
        {
          backgroundColor: theme.colors.background,
          borderBottomColor: theme.colors.border || '#e0e0e0',
        },
      ]}
    >
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Tạo nhóm chat</Text>
      <View style={styles.headerPlaceholder} />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      <SafeAreaView style={styles.safeArea}>
        {renderHeader()}

        <View style={styles.content}>
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: theme.colors.border || '#e0e0e0',
                  color: theme.colors.text,
                  backgroundColor: theme.colors.background,
                },
              ]}
              placeholder="Tên nhóm chat"
              placeholderTextColor={theme.colors.textSecondary}
              value={groupName}
              onChangeText={handleNameChange}
              maxLength={100}
            />
            <Text style={[styles.charCount, { color: theme.colors.textSecondary }]}>
              {derivedGroupName.length}/100
            </Text>
          </View>

          {autoGroupName && !isNameDirty && (
            <Text style={[styles.autoNameHint, { color: theme.colors.textSecondary }]}>
              Gợi ý: {autoGroupName}
            </Text>
          )}

          <MutualUserPicker
            currentUserId={currentUserId}
            selectedUsers={selectedUsers}
            onSelectedChange={setSelectedUsers}
            excludeUserIds={[currentUserId]}
          />
        </View>

        <View
          style={[
            styles.footer,
            {
              backgroundColor: theme.colors.background,
              borderTopColor: theme.colors.border || '#e0e0e0',
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.createButton,
              { backgroundColor: canCreate ? theme.colors.primary : theme.colors.textSecondary + '40' },
            ]}
            onPress={handleCreateGroup}
            disabled={!canCreate}
            activeOpacity={0.7}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.createButtonText}>Tạo nhóm chat</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  headerPlaceholder: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  charCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  autoNameHint: {
    fontSize: 12,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  createButton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});

