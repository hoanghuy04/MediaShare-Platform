import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PostResponse } from '../../types/post.type';
import { FollowButton } from '../common/FollowButton';
import { UserSummaryResponse } from '../../types/user';
import { Avatar } from '../common/Avatar';
import React from 'react';

interface FeedFooterProps {
  data: PostResponse;
  onFollowChange?: (isFollowing: boolean) => void;
}

const FeedFooter = ({ data, onFollowChange }: FeedFooterProps) => {
  const { author, caption } = data;

  const authorData = author as UserSummaryResponse;
  const authorName = authorData.profile?.firstName || authorData.username || 'Unknown';
  const authorAvatar = authorData.profile?.avatar;
  const initiallyFollowing = authorData.followingByCurrentUser || false;

  const handleFollowChange = (status: boolean) => {
    onFollowChange?.(status);
  };

  return (
    <View style={styles.container}>
      <View style={styles.profileContainer}>
        <Avatar
          uri={authorAvatar}
          name={authorData.username}
          size={30}
        />
        <View style={styles.userInfo}>
          <View style={styles.userNameContainer}>
            <Text style={styles.nameStyle}>{authorName}</Text>

            {!initiallyFollowing && (
              <FollowButton
                userId={authorData.id}
                initialIsFollowing={false}
                variant="transparent"
                size="small"
                textColor="#fff"
                followingTextColor="#fff"
                style={styles.followButton}
                onFollowChange={handleFollowChange}
              />
            )}
          </View>
        </View>
      </View>

      <Text numberOfLines={2} style={styles.desc}>
        {caption || ''}
      </Text>
    </View>
  );
};

export default FeedFooter;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    zIndex: 10,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  thumbnail: {
    width: 30,
    height: 30,
    borderRadius: 20,
    overflow: 'hidden',
  },
  userInfo: {
    marginLeft: 10,
    flex: 1,
  },
  userNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nameStyle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    marginRight: 8,
    flexShrink: 1,
  },
  audioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  audioText: {
    color: '#fff',
    marginLeft: 6,
  },
  followButton: {
    borderColor: '#fff',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 1,
  },
  desc: {
    color: '#fff',
    width: 300,
  },
  friendsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  friendImage: {
    width: 15,
    height: 15,
    borderRadius: 150,
    marginRight: -5,
  },
  followInfo: {
    color: '#fff',
    marginLeft: 13,
    fontSize: 12,
  },
});
