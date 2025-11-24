import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ListRenderItem,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { Avatar } from '../common/Avatar';
import { UserSummaryResponse } from '../../types';

interface FollowingStripProps {
  users: UserSummaryResponse[];
  onPressUser?: (userId: string) => void;
}

export const FollowingStrip: React.FC<FollowingStripProps> = ({ users, onPressUser }) => {
  const { theme } = useTheme();

  const renderItem: ListRenderItem<UserSummaryResponse> = ({ item }) => {
    const displayName =
      item.username && item.username.length > 12
        ? `${item.username.slice(0, 11)}…`
        : item.username || 'user';

    return (
      <TouchableOpacity
        style={styles.item}
        onPress={() => onPressUser?.(item.id)}
        activeOpacity={0.75}
      >
        <View style={styles.avatarWrapper}>
          <Avatar uri={item.profile?.avatar} name={item.username} size={36} />
          {item.isVerified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark" size={10} color="#2563EB" />
            </View>
          )}
        </View>
        <Text
          style={[styles.username, { color: theme.colors.textSecondary }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {displayName}
        </Text>
      </TouchableOpacity>
    );
  };

  if (!users || users.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>Chưa theo dõi ai</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={users}
      keyExtractor={item => item.id}
      horizontal
      showsHorizontalScrollIndicator={false}
      renderItem={renderItem}
      contentContainerStyle={styles.listContent}
    />
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingRight: 16,
  },
  item: {
    width: 56,
    marginRight: 10,
    alignItems: 'center',
  },
  avatarWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 1,
  },
  username: {
    marginTop: 6,
    fontSize: 11,
    textAlign: 'center',
    width: 50,
  },
  emptyState: {
    paddingVertical: 8,
  },
  emptyText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});


