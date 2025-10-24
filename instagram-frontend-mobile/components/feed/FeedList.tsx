import React from 'react';
import { FlatList, RefreshControl, View, StyleSheet } from 'react-native';
import { Post } from '@types';
import { useTheme } from '@hooks/useTheme';
import { PostCard } from './PostCard';
import { StoriesRow } from './StoriesRow';
import { CaughtUpNotice } from './CaughtUpNotice';
import { SuggestedAccountCard } from './SuggestedAccountCard';
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
  onBookmark?: (postId: string) => void;
  onFollow?: (userId: string) => void;
  showStories?: boolean;
  showCaughtUp?: boolean;
  suggestedAccount?: any;
}

export const FeedList: React.FC<FeedListProps> = ({
  posts = [],
  isLoading,
  isRefreshing,
  hasMore,
  onRefresh,
  onLoadMore,
  onLike,
  onComment,
  onShare,
  onBookmark,
  onFollow,
  showStories = true,
  showCaughtUp = true,
  suggestedAccount,
}) => {
  const { theme } = useTheme();

  // Mock stories data - in production, fetch from API
  const mockStories = [
    { id: '1', username: 'hoanghuy_12', hasStory: true },
    { id: '2', username: 'trnngochn_19', hasStory: false },
    { id: '3', username: 'varmos_0212', hasStory: true },
  ];

  const renderPost = ({ item, index }: { item: Post; index: number }) => {
    // Show "Caught Up" notice after 3 posts
    const showCaughtUpAfterThis = showCaughtUp && index === 2;
    // Show suggested account after 5 posts
    const showSuggestedAfterThis = suggestedAccount && index === 4;

    return (
      <>
        <PostCard
          post={item}
          showFollowButton={!item.author.isFollowing}
          onLike={onLike}
          onComment={onComment}
          onShare={onShare}
          onBookmark={onBookmark}
          onFollow={onFollow}
        />
        {showCaughtUpAfterThis && <CaughtUpNotice />}
        {showSuggestedAfterThis && (
          <SuggestedAccountCard
            account={suggestedAccount}
            onFollow={onFollow}
          />
        )}
      </>
    );
  };

  const renderHeader = () => {
    if (!showStories) return null;
    return <StoriesRow stories={mockStories} />;
  };

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
      contentContainerStyle={[styles.container, posts?.length === 0 && styles.emptyContainer]}
      ListHeaderComponent={renderHeader}
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
