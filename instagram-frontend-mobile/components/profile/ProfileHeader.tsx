import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserProfile } from '@types';
import { useTheme } from '@hooks/useTheme';
import { Avatar } from '../common/Avatar';
import { formatNumber } from '@utils/formatters';

interface ProfileHeaderProps {
  profile: UserProfile;
  isOwnProfile: boolean;
  onFollow?: () => void;
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

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <Avatar uri={profile.profileImage} name={profile.fullName} size={80} />
        
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {formatNumber(profile.postsCount)}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Posts</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {formatNumber(profile.followersCount)}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Followers
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {formatNumber(profile.followingCount)}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Following
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.infoSection}>
        <Text style={[styles.fullName, { color: theme.colors.text }]}>{profile.fullName}</Text>
        {profile.bio && (
          <Text style={[styles.bio, { color: theme.colors.text }]}>{profile.bio}</Text>
        )}
        {profile.website && (
          <Text style={[styles.website, { color: theme.colors.blue }]}>{profile.website}</Text>
        )}
      </View>

      <View style={styles.actionsSection}>
        {isOwnProfile ? (
          <TouchableOpacity
            style={[styles.button, styles.editButton, { borderColor: theme.colors.border }]}
            onPress={onEdit}
          >
            <Text style={[styles.buttonText, { color: theme.colors.text }]}>Edit Profile</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={[
                styles.button,
                styles.followButton,
                {
                  backgroundColor: profile.isFollowing
                    ? theme.colors.surface
                    : theme.colors.primary,
                  borderColor: theme.colors.border,
                },
              ]}
              onPress={onFollow}
            >
              <Text
                style={[
                  styles.buttonText,
                  { color: profile.isFollowing ? theme.colors.text : '#fff' },
                ]}
              >
                {profile.isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.messageButton, { borderColor: theme.colors.border }]}
              onPress={onMessage}
            >
              <Text style={[styles.buttonText, { color: theme.colors.text }]}>Message</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  topSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stats: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginLeft: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  statLabel: {
    fontSize: 13,
    marginTop: 4,
  },
  infoSection: {
    marginBottom: 16,
  },
  fullName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  bio: {
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 4,
  },
  website: {
    fontSize: 14,
  },
  actionsSection: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButton: {
    borderWidth: 1,
  },
  followButton: {
    borderWidth: 1,
  },
  messageButton: {
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

