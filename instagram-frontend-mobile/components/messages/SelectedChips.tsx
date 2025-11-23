import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../common/Avatar';
import { useTheme } from '../../hooks/useTheme';

export interface SelectedChipUser {
  id: string;
  username: string;
  displayName?: string;
  avatar?: string;
  isVerified?: boolean;
}

interface SelectedChipsProps {
  selectedUsers: Record<string, SelectedChipUser>;
  onRemove: (userId: string) => void;
}

/**
 * Component hiển thị danh sách chips của các thành viên đã chọn
 * Scroll ngang, mỗi chip có avatar, tên rút gọn và nút xóa
 */
export const SelectedChips: React.FC<SelectedChipsProps> = ({
  selectedUsers,
  onRemove,
}) => {
  const { theme } = useTheme();
  const selectedList = Object.values(selectedUsers);

  if (selectedList.length === 0) {
    return null;
  }

  const getDisplayName = (user: SelectedChipUser): string => {
    if (user.displayName && user.displayName.trim().length > 0) {
      return user.displayName;
    }
    return user.username || 'User';
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {selectedList.map(user => (
          <View
            key={user.id}
            style={[
              styles.chip,
              {
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.border || '#e0e0e0',
              },
            ]}
          >
            <Avatar
              uri={user.avatar}
              name={getDisplayName(user)}
              size={32}
            />
            <Text
              style={[styles.chipText, { color: theme.colors.text }]}
              numberOfLines={1}
            >
              {getDisplayName(user)}
            </Text>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => onRemove(user.id)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Bỏ chọn"
              accessibilityRole="button"
            >
              <Ionicons name="close-circle" size={18} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    maxHeight: 60,
  },
  scrollContent: {
    paddingRight: 16,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    gap: 6,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    maxWidth: 80,
  },
  removeButton: {
    marginLeft: 2,
  },
});

