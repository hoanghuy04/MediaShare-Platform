import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, LayoutChangeEvent } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { useTheme } from '@hooks/useTheme';
import { useInfiniteScroll } from '@hooks/useInfiniteScroll';

import { FeedHeader } from '@components/feed/FeedHeader';
import { FeedList } from '@components/feed/FeedList';
import { UploadProgressWidget } from '@components/feed/UploadProgressWidget';

import { postAPI, userAPI } from '@services/api';
import { postService } from '../../services/post.service';
import { showAlert } from '@utils/helpers';

export default function FeedScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const hasInitialized = useRef(false);

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
  } = useInfiniteScroll({
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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  };
  const handleUploadFinished = () => refresh();

  const handleLike = async (id: string) => {
    try {
      await postAPI.likePost(id);
    } catch (e: any) {
      showAlert('Error', e.message);
    }
  };
  const handleComment = (id: string) => router.push(`/posts/${id}`);
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
