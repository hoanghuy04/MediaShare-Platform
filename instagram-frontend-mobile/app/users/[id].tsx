import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@hooks/useTheme';
import { useAuth } from '@hooks/useAuth';
import { useInfiniteScroll } from '@hooks/useInfiniteScroll';
import { Header } from '@components/common/Header';
import { ProfileHeader } from '@components/profile/ProfileHeader';
import { PostGrid } from '@components/profile/PostGrid';
import { LoadingSpinner } from '@components/common/LoadingSpinner';
import { userAPI, postAPI } from '@services/api';
import { UserProfile } from '@types';
import { showAlert } from '@utils/helpers';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const {
    data: posts,
    isLoading: isLoadingPosts,
    loadMore,
    refresh: refreshPosts,
  } = useInfiniteScroll({
    fetchFunc: (page, limit) => postAPI.getUserPosts(id, page, limit),
    limit: 30,
    onError: error => showAlert('Error', error.message),
  });

  useEffect(() => {
    loadProfile();
    refreshPosts();
  }, [id]);

  const loadProfile = async () => {
    try {
      const data = await userAPI.getUserProfile(id);
      setProfile(data);
    } catch (error: any) {
      showAlert('Error', error.message);
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!profile) return;

    try {
      if (profile.isFollowing) {
        await userAPI.unfollowUser(id);
        setProfile({
          ...profile,
          isFollowing: false,
          followersCount: (profile.followersCount || 0) - 1,
        });
      } else {
        await userAPI.followUser(id);
        setProfile({
          ...profile,
          isFollowing: true,
          followersCount: (profile.followersCount || 0) + 1,
        });
      }
    } catch (error: any) {
      showAlert('Error', error.message);
    }
  };

  const handleMessage = () => {
    // TODO: Create conversation and navigate to messages
    router.push('/(tabs)/messages');
  };

  if (isLoading || !profile) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Header showBack />
        <LoadingSpinner />
      </View>
    );
  }

  const isOwnProfile = currentUser?.id === id;

  // Add postsCount to profile
  const profileWithPosts = {
    ...profile,
    postsCount: posts?.length || profile.postsCount || 0,
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header showBack title={profile.username} />
      <ScrollView>
        <ProfileHeader
          profile={profileWithPosts}
          isOwnProfile={isOwnProfile}
          onFollow={handleFollow}
          onMessage={handleMessage}
        />
        {isLoadingPosts ? <LoadingSpinner /> : <PostGrid posts={posts} onEndReached={loadMore} />}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
