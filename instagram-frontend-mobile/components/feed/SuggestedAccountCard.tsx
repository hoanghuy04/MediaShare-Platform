import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@hooks/useTheme';
import { Avatar } from '../common/Avatar';

interface SuggestedAccount {
  id: string;
  username: string;
  avatar?: string;
  fullName?: string;
}

interface SuggestedAccountCardProps {
  account: SuggestedAccount;
  onFollow?: (userId: string) => void;
  onMenuPress?: (userId: string) => void;
}

export const SuggestedAccountCard: React.FC<SuggestedAccountCardProps> = ({
  account,
  onFollow,
  onMenuPress,
}) => {
  const { theme } = useTheme();
  const router = useRouter();

  const handlePress = () => {
    router.push(`/users/${account.id}`);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <TouchableOpacity style={styles.leftSection} onPress={handlePress}>
        <Avatar uri={account.avatar} name={account.username} size={48} />
        <View style={styles.textContainer}>
          <Text style={[styles.username, { color: theme.colors.text }]}>
            {account.username}
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Gợi ý cho bạn
          </Text>
        </View>
      </TouchableOpacity>

      <View style={styles.rightSection}>
        <TouchableOpacity
          style={[styles.followButton, { backgroundColor: theme.colors.background }]}
          onPress={() => onFollow?.(account.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={[styles.followText, { color: theme.colors.text }]}>Theo dõi</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onMenuPress?.(account.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="ellipsis-vertical" size={20} color={theme.colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  textContainer: {
    marginLeft: 12,
    flex: 1,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  followButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#000',
  },
  followText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});

