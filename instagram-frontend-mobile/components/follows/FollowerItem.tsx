import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FollowerUserResponse } from '../../types/user';
import { Avatar } from '../common/Avatar';
import { Theme } from '../../styles/theme';
import { FollowButton } from '../common/FollowButton';
import { MessageButton } from '../common/MessageButton';

interface FollowerItemProps {
  item: FollowerUserResponse;
  currentUserId?: string;
  profileId?: string;
  theme: Theme;
  onFollowToggle: (id: string) => void;
  onRemove: (follower: FollowerUserResponse) => void;
}

export const FollowerItem: React.FC<FollowerItemProps> = ({
  item,
  currentUserId,
  profileId,
  theme,
  onFollowToggle,
  onRemove,
}) => {
  const router = useRouter();
  const isCurrentUser = currentUserId === item.id;
  const isMyProfile = currentUserId === profileId;

  const [isFollowing, setIsFollowing] = useState(item.followingByCurrentUser);

  useEffect(() => {
    setIsFollowing(item.followingByCurrentUser);
  }, [item.followingByCurrentUser]);

  const handleFollowChange = (newState: boolean) => {
    setIsFollowing(newState);
    onFollowToggle(item.id);
  };

  return (
    <TouchableOpacity style={styles.userItem} onPress={() => router.push(`/users/${item.id}`)}>
      <View style={styles.userInfo}>
        <Avatar uri={item.avatarUrl} name={item.username} size={44} style={styles.avatar} />
        <View>
          <Text style={[styles.username, { color: theme.colors.text }]}>{item.username}</Text>
          <Text style={[styles.fullname, { color: theme.colors.gray }]}>{item.username}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        {!isCurrentUser && (
          <>
            {isMyProfile ? (
              // Đang xem follower/following của chính mình
              isFollowing ? (
                <MessageButton size="small" onPress={() => {}} />
              ) : (
                <FollowButton
                  userId={item.id}
                  initialIsFollowing={item.followingByCurrentUser}
                  variant="primary"
                  size="small"
                  backgroundColor={theme.colors.primary}
                  textColor={theme.colors.white}
                  onFollowChange={handleFollowChange}
                  notFollowingText="Theo dõi lại"
                  followingText="Đang theo dõi"
                />
              )
            ) : (
              // Đang xem danh sách của profile khác
              <>
                {isFollowing ? (
                  // ĐÃ theo dõi -> tuỳ bạn muốn hiện gì, ví dụ: follow xám + nhắn tin
                  <>
                    <FollowButton
                      userId={item.id}
                      initialIsFollowing={item.followingByCurrentUser}
                      variant="grey"
                      size="small"
                      onFollowChange={handleFollowChange}
                    />
                    <MessageButton size="small" onPress={() => {}} />
                  </>
                ) : (
                  // CHƯA theo dõi -> chỉ hiện nút theo dõi primary, KHÔNG hiện nhắn tin
                  <FollowButton
                    userId={item.id}
                    initialIsFollowing={item.followingByCurrentUser}
                    variant="primary"
                    size="small"
                    backgroundColor={theme.colors.primary}
                    textColor={theme.colors.white}
                    onFollowChange={handleFollowChange}
                    notFollowingText="Theo dõi"
                    followingText="Đang theo dõi"
                  />
                )}
              </>
            )}
          </>
        )}

        {isMyProfile && (
          <TouchableOpacity style={styles.closeButton} onPress={() => onRemove(item)}>
            <Ionicons name="close" size={20} color={theme.colors.text} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  userItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    marginRight: 12,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
  },
  fullname: {
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  closeButton: {
    padding: 4,
  },
});
