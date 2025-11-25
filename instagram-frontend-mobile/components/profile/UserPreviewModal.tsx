import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@hooks/useTheme';
import { Avatar } from '../common/Avatar';

const { width } = Dimensions.get('window');

interface UserPreviewModalProps {
  visible: boolean;
  onClose: () => void;
  onViewProfile: () => void;
  userId: string;
  username: string;
  fullName?: string;
  avatar?: string;
}

export const UserPreviewModal: React.FC<UserPreviewModalProps> = ({
  visible,
  onClose,
  onViewProfile,
  username,
  fullName,
  avatar,
}) => {
  const { theme } = useTheme();

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
          {/* Close button */}
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          {/* User Info */}
          <View style={styles.content}>
            <Avatar uri={avatar} name={username} size={100} />
            
            <Text style={[styles.username, { color: theme.colors.text }]}>
              {username}
            </Text>
            
            {fullName && (
              <Text style={[styles.fullName, { color: theme.colors.textSecondary }]}>
                {fullName}
              </Text>
            )}

            {/* View Profile Button */}
            <TouchableOpacity
              style={[styles.viewProfileButton, { backgroundColor: theme.colors.primary }]}
              onPress={onViewProfile}
            >
              <Text style={styles.viewProfileText}>Xem trang cá nhân</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: width * 0.85,
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
    zIndex: 1,
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  username: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
  },
  fullName: {
    fontSize: 16,
    marginTop: 4,
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 20,
    marginBottom: 24,
  },
  viewProfileButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  viewProfileText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
