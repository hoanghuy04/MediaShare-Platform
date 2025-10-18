import React from 'react';
import { FlatList, RefreshControl, View, StyleSheet } from 'react-native';
import { Post } from '@types';
import { useTheme } from '@hooks/useTheme';
import { PostCard } from './PostCard';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { EmptyState } from '../common/EmptyState';

interface FeedListProps {
  posts: Post[];
  isLoading: boolean;
  isRefreshing: boolean;
  hasMore: boolean;
  onRefresh: () => void;
  onLoadMore: () => void;
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
}

export const FeedList: React.FC<FeedListProps> = ({
  posts,
  isLoading,
  isRefreshing,
  hasMore,
  onRefresh,
  onLoadMore,
  onLike,
  onComment,
  onShare,
}) => {
  const { theme } = useTheme();

  const renderPost = ({ item }: { item: Post }) => (
    <PostCard post={item} onLike={onLike} onComment={onComment} onShare={onShare} />
  );

  const renderFooter = () => {
    if (!hasMore) return null;
    return (
      <View style={styles.footer}>
        <LoadingSpinner size="small" />
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) return <LoadingSpinner />;
    return (
      <EmptyState
        icon="images-outline"
        title="No Posts Yet"
        description="Follow some users to see their posts in your feed"
      />
    );
  };

  return (
    <FlatList
      data={posts}
      renderItem={renderPost}
      keyExtractor={item => item.id}
      contentContainerStyle={[
        styles.container,
        posts.length === 0 && styles.emptyContainer,
      ]}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor={theme.colors.primary}
        />
      }
      onEndReached={onLoadMore}
      onEndReachedThreshold={0.5}
      ListFooterComponent={renderFooter}
      ListEmptyComponent={renderEmpty}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 8,
  },
  emptyContainer: {
    flexGrow: 1,
  },
  footer: {
    paddingVertical: 20,
  },
});

