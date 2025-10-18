import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@hooks/useTheme';
import { useAuth } from '@hooks/useAuth';
import { useInfiniteScroll } from '@hooks/useInfiniteScroll';
import { Header } from '@components/common/Header';
import { ProfileHeader } from '@components/profile/ProfileHeader';
import { PostGrid } from '@components/profile/PostGrid';
import { LoadingSpinner } from '@components/common/LoadingSpinner';
import { postAPI } from '@services/api';
import { showAlert } from '@utils/helpers';

export default function ProfileScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { user, logout } = useAuth();

  const {
    data: posts,
    isLoading,
    loadMore,
    refresh,
  } = useInfiniteScroll({
    fetchFunc: (page, limit) => postAPI.getUserPosts(user?.id || '', page, limit),
    limit: 30,
    onError: error => showAlert('Error', error.message),
  });

  useEffect(() => {
    if (user?.id) {
      refresh();
    }
  }, [user?.id]);

  const handleEdit = () => {
    // TODO: Navigate to edit profile screen
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error: any) {
      showAlert('Error', error.message);
    }
  };

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <LoadingSpinner />
      </View>
    );
  }

  const userProfile = {
    ...user,
    postsCount: posts.length,
    followersCount: 0,
    followingCount: 0,
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header title={user.username} rightIcon="menu" onRightPress={handleLogout} />
      <ScrollView>
        <ProfileHeader profile={userProfile} isOwnProfile onEdit={handleEdit} />
        {isLoading ? <LoadingSpinner /> : <PostGrid posts={posts} onEndReached={loadMore} />}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

