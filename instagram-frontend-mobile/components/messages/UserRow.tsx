import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../common/Avatar';
import { useTheme } from '../../hooks/useTheme';

export interface UserRowItem {
  id: string;
  username: string;
  displayName?: string;
  avatar?: string;
  isVerified?: boolean;
}

interface UserRowProps {
  user: UserRowItem;
  isSelected: boolean;
  onToggle: () => void;
}

/**
 * Component hiển thị một hàng user trong danh sách gợi ý
 * Gồm avatar, displayName, username và checkbox
 */
export const UserRow: React.FC<UserRowProps> = ({ user, isSelected, onToggle }) => {
  const { theme } = useTheme();

  const getDisplayName = (): string => {
    if (user.displayName && user.displayName.trim().length > 0) {
      return user.displayName;
    }
    return user.username || 'User';
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
          borderBottomColor: theme.colors.border || '#f0f0f0',
        },
      ]}
      onPress={onToggle}
      activeOpacity={0.7}
      accessibilityLabel={`${getDisplayName()}, ${isSelected ? 'đã chọn' : 'chưa chọn'}`}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: isSelected }}
    >
        <Avatar
          uri={user.avatar}
          name={getDisplayName()}
          size={40}
        />
      <View style={styles.textContainer}>
        <Text style={[styles.displayName, { color: theme.colors.text }]} numberOfLines={1}>
          {getDisplayName()}
        </Text>
        <Text style={[styles.username, { color: theme.colors.textSecondary }]} numberOfLines={1}>
          @{user.username || 'user'}
        </Text>
      </View>
      <View style={styles.checkboxContainer}>
        <Ionicons
          name={isSelected ? 'checkbox' : 'square-outline'}
          size={24}
          color={isSelected ? theme.colors.primary : theme.colors.textSecondary}
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  displayName: {
    fontSize: 16,
    fontWeight: '500',
  },
  username: {
    fontSize: 14,
  },
  checkboxContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

