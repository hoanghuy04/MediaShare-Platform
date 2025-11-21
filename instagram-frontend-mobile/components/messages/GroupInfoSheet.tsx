import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Conversation } from '../../types';
import { useTheme } from '../../hooks/useTheme';
import { Avatar } from '../common/Avatar';

interface GroupInfoSheetProps {
  visible: boolean;
  conversation?: Conversation;
  currentUserId: string;
  onClose: () => void;
  onAddMembers: () => void;
  onLeaveGroup: () => void;
}

export const GroupInfoSheet: React.FC<GroupInfoSheetProps> = ({
  visible,
  conversation,
  currentUserId,
  onClose,
  onAddMembers,
  onLeaveGroup,
}) => {
  const { theme } = useTheme();

  if (!conversation) {
    return null;
  }

  const participants = conversation.participants || [];
  const isAdmin = conversation.admins?.includes(currentUserId);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colors.background,
            },
          ]}
        >
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: theme.colors.text }]}>{conversation.name || 'Nhóm chat'}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.memberCount, { color: theme.colors.textSecondary }]}>
            {participants.length} thành viên
          </Text>

          <ScrollView style={styles.memberList} showsVerticalScrollIndicator={false}>
            {participants.map(member => (
              <View key={member.userId} style={styles.memberRow}>
                <Avatar uri={member.avatar} name={member.username} size={40} />
                <View style={styles.memberInfo}>
                  <Text style={[styles.memberName, { color: theme.colors.text }]}>{member.username}</Text>
                  <Text style={[styles.memberMeta, { color: theme.colors.textSecondary }]}>
                    {member.role === 'ADMIN' ? 'Quản trị viên' : 'Thành viên'}
                  </Text>
                </View>
                {member.userId === currentUserId && (
                  <Text style={[styles.youTag, { color: theme.colors.textSecondary }]}>Bạn</Text>
                )}
              </View>
            ))}
          </ScrollView>

          <View style={styles.actions}>
            {isAdmin && (
              <TouchableOpacity style={styles.primaryButton} onPress={onAddMembers}>
                <Ionicons name="person-add" size={18} color="white" style={{ marginRight: 6 }} />
                <Text style={styles.primaryButtonText}>Thêm thành viên</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.secondaryButton} onPress={onLeaveGroup}>
              <Ionicons name="exit-outline" size={18} color="#ff4d4f" style={{ marginRight: 6 }} />
              <Text style={styles.secondaryButtonText}>Rời nhóm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: 24,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  memberCount: {
    fontSize: 13,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  memberList: {
    maxHeight: 320,
    paddingHorizontal: 20,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  memberInfo: {
    flex: 1,
    marginLeft: 12,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '500',
  },
  memberMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  youTag: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  actions: {
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 10,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0095F6',
    paddingVertical: 12,
    borderRadius: 10,
  },
  primaryButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,77,79,0.12)',
    paddingVertical: 12,
    borderRadius: 10,
  },
  secondaryButtonText: {
    color: '#ff4d4f',
    fontWeight: '600',
    fontSize: 15,
  },
});


