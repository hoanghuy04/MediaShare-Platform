import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTheme } from '@hooks/useTheme';
import { useInfiniteScroll } from '@hooks/useInfiniteScroll';
import { FeedHeader } from '@components/feed/FeedHeader';
import { FeedList } from '@components/feed/FeedList';
import { postAPI, userAPI } from '@services/api';
import { showAlert } from '@utils/helpers';

export default function FeedScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const hasInitialized = useRef(false);
  const flatListRef = useRef<any>(null);

  const {
    data: posts,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    refresh,
  } = useInfiniteScroll({
    fetchFunc: postAPI.getFeed,
    limit: 20,
    onError: error => showAlert('Error', error.message),
  });

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      refresh();
    }
  }, []);

  // Refresh feed when screen comes into focus (e.g., after creating a post)
  useFocusEffect(
    React.useCallback(() => {
      if (hasInitialized.current) {
        console.log('Feed screen focused, refreshing...');
        refresh().then(() => {
          // Scroll to top sau khi refresh để hiển thị post mới ở đầu
          setTimeout(() => {
            flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
          }, 100);
        });
      }
    }, [refresh])
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  };

  const handleLike = async (postId: string) => {
    try {
      await postAPI.likePost(postId);
      // TODO: Update post in local state
    } catch (error: any) {
      showAlert('Error', error.message);
    }
  };

  const handleComment = (postId: string) => {
    router.push(`/posts/${postId}`);
  };

  const handleShare = (postId: string) => {
    // TODO: Implement share functionality
    showAlert('Share', 'Share functionality coming soon');
  };

  const handleBookmark = async (postId: string) => {
    try {
      // TODO: Implement bookmark API
      showAlert('Saved', 'Post saved to your collection');
    } catch (error: any) {
      showAlert('Error', error.message);
    }
  };

  const handleFollow = async (userId: string) => {
    try {
      await userAPI.followUser(userId);
      // TODO: Update user following status in local state
      showAlert('Success', 'You are now following this user');
    } catch (error: any) {
      showAlert('Error', error.message);
    }
  };

  const handleActivityPress = () => {
    // TODO: Navigate to activity/notifications screen
    showAlert('Activity', 'Activity feature coming soon');
  };

  // Mock suggested account - in production, fetch from API
  const suggestedAccount = {
    id: 'suggested_1',
    username: 'world_of_biology_wob',
    avatar: undefined,
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FeedHeader
        onActivityPress={handleActivityPress}
        hasNotifications={false}
      />
      <FeedList
        ref={flatListRef}
        posts={posts}
        isLoading={isLoading}
        isRefreshing={isRefreshing}
        hasMore={hasMore}
        onRefresh={handleRefresh}
        onLoadMore={loadMore}
        onLike={handleLike}
        onComment={handleComment}
        onShare={handleShare}
        onBookmark={handleBookmark}
        onFollow={handleFollow}
        showStories={true}
        showCaughtUp={posts.length > 3}
        suggestedAccount={suggestedAccount}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
