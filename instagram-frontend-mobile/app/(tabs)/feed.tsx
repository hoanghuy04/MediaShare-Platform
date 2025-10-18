import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@hooks/useTheme';
import { useInfiniteScroll } from '@hooks/useInfiniteScroll';
import { Header } from '@components/common/Header';
import { FeedList } from '@components/feed/FeedList';
import { postAPI } from '@services/api';
import { showAlert } from '@utils/helpers';

export default function FeedScreen() {
  const { theme } = useTheme();
  
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
    refresh();
  }, []);

  const handleLike = async (postId: string) => {
    try {
      await postAPI.likePost(postId);
      // TODO: Update post in local state
    } catch (error: any) {
      showAlert('Error', error.message);
    }
  };

  const handleComment = (postId: string) => {
    // Navigate to post detail
  };

  const handleShare = (postId: string) => {
    // TODO: Implement share functionality
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header title="Instagram" />
      <FeedList
        posts={posts}
        isLoading={isLoading}
        isRefreshing={false}
        hasMore={hasMore}
        onRefresh={refresh}
        onLoadMore={loadMore}
        onLike={handleLike}
        onComment={handleComment}
        onShare={handleShare}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

