import React from 'react';
import {
  Modal,
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MutualUserPicker, MutualUserOption } from './MutualUserPicker';
import { Theme } from '../../hooks/useTheme';

interface Props {
  visible: boolean;
  theme: Theme;
  currentUserId: string; // 👈 thêm
  pendingMembers: Record<string, MutualUserOption>;
  setPendingMembers: (value: Record<string, MutualUserOption>) => void;
  existingMemberIds: string[];
  isAddingMembers: boolean;
  onClose: () => void;
  onConfirm: (userIds: string[]) => Promise<void> | void;
}

export const AddMembersModal: React.FC<Props> = ({
  visible,
  theme,
  currentUserId,
  pendingMembers,
  setPendingMembers,
  existingMemberIds,
  isAddingMembers,
  onClose,
  onConfirm,
}) => {
  const excludeUserIds = [
    ...new Set([...existingMemberIds, currentUserId].filter(Boolean)),
  ];

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView
        style={[
          styles.addMembersModal,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <View style={styles.addMembersHeader}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={22} color={theme.colors.text} />
          </TouchableOpacity>
          <Text
            style={[styles.addMembersTitle, { color: theme.colors.text }]}
          >
            Thêm thành viên
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <MutualUserPicker
          currentUserId={currentUserId}
          selectedUsers={pendingMembers}
          onSelectedChange={setPendingMembers}
          excludeUserIds={excludeUserIds}
          emptyMessage="Chỉ hiện những người theo dõi nhau"
        />

        <View style={styles.addMembersActions}>
          <TouchableOpacity
            style={[
              styles.addMembersSecondaryBtn,
              { borderColor: theme.colors.border || '#e0e0e0' },
            ]}
            onPress={onClose}
          >
            <Text
              style={[
                styles.addMembersSecondaryText,
                { color: theme.colors.text },
              ]}
            >
              Huỷ
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.addMembersPrimaryBtn,
              {
                backgroundColor: theme.colors.primary,
                opacity:
                  Object.keys(pendingMembers).length === 0 || isAddingMembers
                    ? 0.4
                    : 1,
              },
            ]}
            onPress={() => onConfirm(Object.keys(pendingMembers))}
            disabled={
              Object.keys(pendingMembers).length === 0 || isAddingMembers
            }
          >
            {isAddingMembers ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.addMembersPrimaryText}>Thêm</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  addMembersModal: { flex: 1 },
  addMembersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  addMembersTitle: { fontSize: 16, fontWeight: '700' },
  addMembersActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  addMembersPrimaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
  },
  addMembersPrimaryText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 15,
  },
  addMembersSecondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  addMembersSecondaryText: { fontWeight: '700', fontSize: 15 },
});
