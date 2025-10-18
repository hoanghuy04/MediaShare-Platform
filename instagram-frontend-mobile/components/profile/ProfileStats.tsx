import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { UserStats } from '@types';
import { useTheme } from '@hooks/useTheme';
import { formatNumber } from '@utils/formatters';

interface ProfileStatsProps {
  stats: UserStats;
  onFollowersPress?: () => void;
  onFollowingPress?: () => void;
  onPostsPress?: () => void;
}

export const ProfileStats: React.FC<ProfileStatsProps> = ({
  stats,
  onFollowersPress,
  onFollowingPress,
  onPostsPress,
}) => {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.statItem} onPress={onPostsPress}>
        <Text style={[styles.statValue, { color: theme.colors.text }]}>
          {formatNumber(stats.postsCount)}
        </Text>
        <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Posts</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.statItem} onPress={onFollowersPress}>
        <Text style={[styles.statValue, { color: theme.colors.text }]}>
          {formatNumber(stats.followersCount)}
        </Text>
        <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Followers</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.statItem} onPress={onFollowingPress}>
        <Text style={[styles.statValue, { color: theme.colors.text }]}>
          {formatNumber(stats.followingCount)}
        </Text>
        <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Following</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '600',
  },
  statLabel: {
    fontSize: 14,
    marginTop: 4,
  },
});

