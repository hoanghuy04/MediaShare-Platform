import React, { useCallback, useRef, useState } from 'react';
import {
  RefreshControl,
  View,
  StyleSheet,
  ViewToken,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useTheme } from '@hooks/useTheme';
import { PostCard } from './PostCard';
import { FeedReelItem } from './FeedReelItem';
import { CaughtUpNotice } from './CaughtUpNotice';
import { SuggestedAccountCard } from './SuggestedAccountCard';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { EmptyState } from '../common/EmptyState';
import { PostResponse } from '../../types/post.type';
import Animated from 'react-native-reanimated';
import { StoryList } from './StoryList';

interface FeedListProps {
  posts: PostResponse[];
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
  showCaughtUp?: boolean;
  suggestedAccount?: any;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  contentContainerStyle?: any;
  stories?: any[];
  showStories?: boolean;
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
  showCaughtUp = true,
  suggestedAccount,
  onScroll,
  contentContainerStyle,
  stories = [],
  showStories = true,
}) => {
  const { theme } = useTheme();
  const [viewableItemId, setViewableItemId] = useState<string | null>(null);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
    waitForInteraction: false,
  }).current;

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) {
        const visibleItem = viewableItems[0];
        if (visibleItem.item.id) {
          setViewableItemId(visibleItem.item.id);
        }
      }
    },
    []
  );

  const renderPost = ({ item, index }: { item: PostResponse; index: number }) => {
    const isReel = item.type === 'REEL';
    const showCaughtUpAfterThis = showCaughtUp && index === 2;
    const showSuggestedAfterThis = suggestedAccount && index === 4;
    const isVisible = viewableItemId === item.id;

    return (
      <>
        {isReel ? (
          <FeedReelItem 
            post={item} 
            isVisible={isVisible} 
            onLike={onLike}
          />
        ) : (
          <PostCard
            post={item}
            showFollowButton={false}
            onLike={onLike}
            onComment={onComment}
            onShare={onShare}
            onBookmark={onBookmark}
            onFollow={onFollow}
          />
        )}
        {showCaughtUpAfterThis && <CaughtUpNotice />}
        {showSuggestedAfterThis && (
          <SuggestedAccountCard account={suggestedAccount} onFollow={onFollow} />
        )}
      </>
    );
  };

  const renderHeader = () => {
    if (!showStories) return null;
    return (
      <View style={styles.headerContainer}>
        <StoryList stories={stories} />
        <View style={styles.separator} />
      </View>
    );
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
    <Animated.FlatList
      data={posts}
      renderItem={renderPost}
      keyExtractor={item => item.id}
      contentContainerStyle={[posts?.length === 0 && styles.emptyContainer, contentContainerStyle]}
      ListHeaderComponent={renderHeader}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor={theme.colors.primary}
          progressViewOffset={60}
        />
      }
      onEndReached={onLoadMore}
      onEndReachedThreshold={0.5}
      ListFooterComponent={renderFooter}
      ListEmptyComponent={renderEmpty}
      showsVerticalScrollIndicator={false}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={viewabilityConfig}
      onScroll={onScroll}
      scrollEventThrottle={16}
    />
  );
};

const styles = StyleSheet.create({
  emptyContainer: {
    flexGrow: 1,
  },
  footer: {
    paddingVertical: 20,
  },
  headerContainer: {
    paddingTop: 8,
    paddingBottom: 0,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginTop: 8,
  },
});
