import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { UserResponse } from '../../types/user';
import { useTheme } from '@hooks/useTheme';
import { Avatar } from '../common/Avatar';
import { formatNumber } from '@utils/formatters';
import { FollowButton } from '../common/FollowButton';

interface ProfileHeaderProps {
  profile: UserResponse;
  isOwnProfile: boolean;
  onFollow?: (isFollowing: boolean) => void;
  onMessage?: () => void;
  onEdit?: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profile,
  isOwnProfile,
  onFollow,
  onMessage,
  onEdit,
}) => {
  const { theme } = useTheme();
  const router = useRouter();

  const fullName =
    profile.profile?.firstName && profile.profile?.lastName
      ? `${profile.profile.firstName} ${profile.profile.lastName}`
      : profile.profile?.firstName || profile.username;

  const handleWebsitePress = () => {
    if (profile.profile?.website) {
      const url = profile.profile.website.startsWith('http')
        ? profile.profile.website
        : `https://${profile.profile.website}`;
      Linking.openURL(url);
    }
  };

  const handleFollowersPress = () => {
    router.push(`/users/${profile.id}/follows?tab=followers`);
  };

  const handleFollowingPress = () => {
    router.push(`/users/${profile.id}/follows?tab=following`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <Avatar uri={profile.profile?.avatar} name={fullName} size={86} />

        <View style={styles.stats}>
          <TouchableOpacity style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {formatNumber(profile.postsCount || 0)}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.text }]}>bài viết</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.statItem} onPress={handleFollowersPress}>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {formatNumber(profile.followersCount || 0)}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.text }]}>người theo dõi</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.statItem} onPress={handleFollowingPress}>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {formatNumber(profile.followingCount || 0)}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.text }]}>đang theo dõi</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Name and Bio */}
      <View style={styles.infoSection}>
        <Text style={[styles.fullName, { color: theme.colors.text }]}>{fullName}</Text>
        {profile.profile?.bio && (
          <Text style={[styles.bio, { color: theme.colors.text }]}>{profile.profile.bio}</Text>
        )}
        {profile.profile?.website && (
          <TouchableOpacity onPress={handleWebsitePress}>
            <Text style={[styles.website, { color: theme.colors.link }]}>
              {profile.profile.website}
            </Text>
          </TouchableOpacity>
        )}
        {profile.profile?.location && (
          <Text style={[styles.location, { color: theme.colors.textSecondary }]}>
            <Ionicons name="location-outline" size={12} /> {profile.profile.location}
          </Text>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsSection}>
        {isOwnProfile ? (
          <>
            <TouchableOpacity
              style={[
                styles.button,
                styles.primaryButton,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              ]}
              onPress={onEdit}
            >
              <Text style={[styles.buttonText, { color: theme.colors.text }]}>Chỉnh sửa</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                styles.primaryButton,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              ]}
            >
              <Text style={[styles.buttonText, { color: theme.colors.text }]}>
                Chia sẻ trang cá nhân
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.iconButton,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              ]}
            >
              <Ionicons name="person-add-outline" size={20} color={theme.colors.text} />
            </TouchableOpacity>
          </>
        ) : (
          <>
            <FollowButton
              userId={profile.id}
              initialIsFollowing={profile.followingByCurrentUser}
              variant="primary"
              size="medium"
              style={{ flex: 1 }}
            />

            <TouchableOpacity
              style={[
                styles.button,
                styles.primaryButton,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              ]}
              onPress={onMessage}
            >
              <Text style={[styles.buttonText, { color: theme.colors.text }]}>Nhắn tin</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.iconButton,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              ]}
            >
              <Ionicons name="person-add-outline" size={20} color={theme.colors.text} />
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  topSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stats: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginLeft: 28,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  statLabel: {
    fontSize: 13,
    marginTop: 2,
  },
  infoSection: {
    marginBottom: 12,
  },
  fullName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  bio: {
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 2,
  },
  website: {
    fontSize: 14,
    marginBottom: 2,
  },
  location: {
    fontSize: 13,
    marginTop: 2,
  },
  actionsSection: {
    flexDirection: 'row',
    gap: 6,
  },
  button: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    borderWidth: 1,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
