import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, LayoutChangeEvent } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { useTheme } from '@hooks/useTheme';
import { useAuth } from '@hooks/useAuth';
import { useInfiniteScroll } from '@hooks/useInfiniteScroll';

import { FeedHeader } from '@components/feed/FeedHeader';
import { FeedList } from '@components/feed/FeedList';
import { UploadProgressWidget } from '@components/feed/UploadProgressWidget';

import { userAPI } from '@services/api';
import { postService } from '../../services/post.service';
import { postLikeService } from '../../services/post-like.service';
import { showAlert } from '@utils/helpers';
import { PostResponse } from '../../types/post.type';

export default function FeedScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const hasInitialized = useRef(false);
  const flatListRef = useRef<any>(null);

  const [headerHeight, setHeaderHeight] = useState(0);

  const mockStories = [
    { id: '1', username: 'hoanghuy_12', hasStory: true, avatar: 'https://i.pravatar.cc/150?u=1' },
    { id: '2', username: 'trnngochn_19', hasStory: false, avatar: 'https://i.pravatar.cc/150?u=2' },
    { id: '3', username: 'varmos_0212', hasStory: true, avatar: 'https://i.pravatar.cc/150?u=3' },
    { id: '4', username: 'admin_test', hasStory: true, avatar: 'https://i.pravatar.cc/150?u=4' },
  ];

  const translateY = useSharedValue(0);
  const lastContentOffset = useSharedValue(0);
  const isScrolling = useSharedValue(false);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: event => {
      const currentOffset = event.contentOffset.y;
      const diff = currentOffset - lastContentOffset.value;
      if (currentOffset > 0 && isScrolling.value && headerHeight > 0) {
        translateY.value = Math.max(-headerHeight, Math.min(0, translateY.value - diff));
      } else if (currentOffset <= 0) {
        translateY.value = 0;
      }
      lastContentOffset.value = currentOffset;
    },
    onBeginDrag: () => {
      isScrolling.value = true;
    },
    onEndDrag: () => {
      isScrolling.value = false;
    },
  });

  const headerAnimatedStyle = useAnimatedStyle(() => {
    return { transform: [{ translateY: translateY.value }] };
  });

  const onHeaderLayout = (event: LayoutChangeEvent) => {
    const height = event.nativeEvent.layout.height;
    if (Math.abs(height - headerHeight) > 1) {
      setHeaderHeight(height);
    }
  };

  const {
    data: posts,
    isLoading,
    hasMore,
    loadMore,
    refresh,
    updateItem,
  } = useInfiniteScroll<PostResponse>({
    fetchFunc: postService.getFeed,
    limit: 20,
    onError: error => showAlert('Error', error.message),
  });

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      refresh();
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      if (hasInitialized.current) {
        refresh();
      }
    }, [])
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  };
  const handleUploadFinished = () => refresh();

  const handleLike = async (id: string) => {
    try {
      if (!user?.id) {
        showAlert('Error', 'Please login to like posts');
        return;
      }
      
      const post = posts.find(p => p.id === id);
      if (!post) return;
      
      const wasLiked = post.likedByCurrentUser;
      const oldLikeCount = post.totalLike;
      
      console.log('Before like:', { wasLiked, oldLikeCount });
      
      // Optimistic update
      const newLiked = !wasLiked;
      const newLikeCount = newLiked ? oldLikeCount + 1 : Math.max(0, oldLikeCount - 1);
      
      updateItem(id, (item) => ({
        ...item,
        likedByCurrentUser: newLiked,
        totalLike: newLikeCount,
      }));
      
      console.log('After optimistic update:', { newLiked, newLikeCount });

      const response = await postLikeService.toggleLikePost(id);
      
      
      if (response.liked !== newLiked) {
        console.warn('Backend state differs from optimistic update, syncing...');
        updateItem(id, (item) => ({
          ...item,
          likedByCurrentUser: response.liked,
        }));
      }
    } catch (e: any) {
      console.error('Error liking post:', e);
      const post = posts.find(p => p.id === id);
      if (post) {
        updateItem(id, (item) => ({
          ...item,
          likedByCurrentUser: post.likedByCurrentUser,
          totalLike: post.totalLike,
        }));
      }
      showAlert('Error', e.message);
    }
  };
  const handleComment = (id: string) => {
    showAlert('Comments', 'Comment feature coming soon');
  };
  const handleShare = () => showAlert('Share', 'Coming soon');
  const handleBookmark = () => showAlert('Saved', 'Saved to collection');
  const handleFollow = async (id: string) => {
    try {
      await userAPI.followUser(id);
      showAlert('Success', 'Followed user');
    } catch (e: any) {
      showAlert('Error', e.message);
    }
  };
  const handleActivityPress = () => showAlert('Activity', 'Coming soon');

  const suggestedAccount = {
    id: 'suggested_1',
    username: 'world_of_biology_wob',
    avatar: undefined,
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Animated.View
        onLayout={onHeaderLayout}
        style={[
          styles.headerWrapper,
          { backgroundColor: theme.colors.background },
          headerAnimatedStyle,
        ]}
      >
        <FeedHeader onActivityPress={handleActivityPress} hasNotifications={false} />
        <UploadProgressWidget onRefreshFeed={handleUploadFinished} />
      </Animated.View>

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
        stories={mockStories}
        showCaughtUp={posts.length > 3}
        suggestedAccount={suggestedAccount}
        onScroll={scrollHandler}
        contentContainerStyle={{
          paddingTop: headerHeight > 0 ? headerHeight : 60,
          paddingBottom: 20,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    elevation: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
});
