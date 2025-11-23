import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Platform,
  TouchableOpacity,
  Text,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@hooks/useTheme';
import { useAuth } from '@hooks/useAuth';
import { useInfiniteScroll } from '@hooks/useInfiniteScroll';
import { PostCard } from '@components/feed/PostCard';
import { LoadingSpinner } from '@components/common/LoadingSpinner';
import { postService } from '@/services/post.service';
import { postLikeService } from '@/services/post-like.service';
import { showAlert } from '@utils/helpers';
import { PostResponse } from '@/types/post.type';

export default function UserPostsScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const flatListRef = useRef<FlatList>(null);
  const [scrolledToPost, setScrolledToPost] = useState(false);

  const userId = params.userId as string || user?.id;
  const selectedPostId = params.postId as string;

  const {
    data: posts,
    isLoading,
    loadMore,
    refresh,
    updateItem,
  } = useInfiniteScroll<PostResponse>({
    fetchFunc: (page, limit) => postService.getUserPosts(userId, page, limit),
    limit: 20,
    onError: error => showAlert('Lỗi', error.message),
  });

  useEffect(() => {
    if (userId) {
      refresh();
    }
  }, [userId]);

  // Scroll to selected post after data loads
  useEffect(() => {
    if (!scrolledToPost && selectedPostId && posts && posts.length > 0) {
      const index = posts.findIndex(post => post.id === selectedPostId);
      if (index !== -1) {
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({
            index,
            animated: true,
            viewPosition: 0,
          });
          setScrolledToPost(true);
        }, 300);
      }
    }
  }, [selectedPostId, posts, scrolledToPost]);

  const handleLike = async (postId: string) => {
    try {
      await postLikeService.toggleLikePost(postId);
      // Refresh to sync with server state
      refresh();
    } catch (error: any) {
      showAlert('Lỗi', error.message || 'Không thể thực hiện thao tác');
    }
  };

  const handleComment = (postId: string) => {
    router.push(`/posts/${postId}/comments`);
  };

  const handleShare = (postId: string) => {
    // TODO: Implement share functionality
  };

  const handleBookmark = (postId: string) => {
    // TODO: Implement bookmark functionality
  };

  const handleScrollToIndexFailed = (info: {
    index: number;
    highestMeasuredFrameIndex: number;
    averageItemLength: number;
  }) => {
    // Wait for the list to render and try again
    setTimeout(() => {
      flatListRef.current?.scrollToIndex({
        index: info.index,
        animated: true,
        viewPosition: 0,
      });
    }, 100);
  };

  const renderItem = ({ item }: { item: PostResponse }) => (
    <PostCard
      post={item}
      onLike={handleLike}
      onComment={handleComment}
      onShare={handleShare}
      onBookmark={handleBookmark}
      disableNavigation
    />
  );

  const renderHeader = () => (
    <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Bài viết</Text>
      <View style={styles.backButton} />
    </View>
  );

  if (isLoading && !posts) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {renderHeader()}
        <LoadingSpinner />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {renderHeader()}
      <FlatList
        ref={flatListRef}
        data={posts}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        onRefresh={refresh}
        refreshing={isLoading}
        showsVerticalScrollIndicator={false}
        onScrollToIndexFailed={handleScrollToIndexFailed}
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={10}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              Chưa có bài viết nào
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
    width: 32,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
  },
});
