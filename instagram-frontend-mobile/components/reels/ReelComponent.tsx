import {
  Animated,
  StyleSheet,
  View,
  StatusBar,
  LayoutChangeEvent,
} from 'react-native';
import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { useLocalSearchParams } from 'expo-router';

import FeedRow from './FeedRow';
import FeedHeader from './FeedHeader';
import ReelSkeleton from './ReelSkeleton';
import { postService } from '../../services/post.service';
import { PostResponse } from '../../types/post.type';

const REELS_PER_PAGE = 5;
const PREFETCH_THRESHOLD = 3;

const ReelComponent = () => {
  const [containerHeight, setContainerHeight] = useState(0);
  const scrollY = useRef(new Animated.Value(0)).current;
  const params = useLocalSearchParams();
  const initialPostId = params.initialPostId as string | undefined;

  const [currentTab, setCurrentTab] = useState<'reels' | 'friends'>('reels');
  const [reels, setReels] = useState<PostResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [scrollInfo, setScrollInfo] = useState({ isViewable: true, index: 0 });

  const refFlatList = useRef<Animated.FlatList>(null);
  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 });

  const data = useMemo(() => {
    if (reels.length === 0 && loading) {
      return Array.from({ length: 3 }).map((_, i) => ({ id: `initial-${i}`, isSkeleton: true }));
    }
    if (hasMore) {
      return [...reels, { id: 'sticky-skeleton-loader', isSkeleton: true }];
    }
    return reels;
  }, [reels, loading, hasMore]);

  const fetchReels = async (pageNum: number, tab: 'reels' | 'friends') => {
    if (loading) return;
    setLoading(true);
    try {
      const limit = REELS_PER_PAGE;
      const res = await postService.getReels(pageNum, limit);
      const newReels = res.content || [];

      if (newReels.length < limit) setHasMore(false);

      setReels(prev => {
        if (pageNum === 0) return newReels;
        const existingIds = new Set(prev.map(r => r.id));
        const uniqueNewReels = newReels.filter(r => !existingIds.has(r.id));
        return [...prev, ...uniqueNewReels];
      });
    } catch (error) {
      console.error('Error fetching reels:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReels(0, currentTab);
  }, []);

  useEffect(() => {
    const loadInitialPost = async () => {
      if (initialPostId && reels.length > 0) {
        const existingIndex = reels.findIndex(reel => reel.id === initialPostId);
        if (existingIndex !== -1) {
          setTimeout(() => {
            refFlatList.current?.scrollToIndex({ index: existingIndex, animated: false });
          }, 100);
        } else {
          try {
            const post = await postService.getPostById(initialPostId);
            setReels(prevReels => [post, ...prevReels]);
            setTimeout(() => {
              refFlatList.current?.scrollToIndex({ index: 0, animated: false });
            }, 100);
          } catch (error) {
            console.error('Error fetching initial post:', error);
          }
        }
      }
    };
    loadInitialPost();
  }, [initialPostId, reels.length]);

  const handleTabChange = (newTab: 'reels' | 'friends') => {
    if (currentTab === newTab) return;
    setCurrentTab(newTab);
    setReels([]);
    setPage(0);
    setHasMore(true);
    fetchReels(0, newTab);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchReels(nextPage, currentTab);
    }
  };

  const onViewableItemsChanged = useCallback(({ changed, viewableItems }) => {
    if (changed.length > 0) {
      setScrollInfo({
        isViewable: changed[0].isViewable,
        index: changed[0].index,
      });
    }

    if (viewableItems && viewableItems.length > 0) {
      const lastViewableItem = viewableItems[viewableItems.length - 1];
      const totalRealItems = reels.length;

      if (
        lastViewableItem.index >= totalRealItems - PREFETCH_THRESHOLD &&
        !loading &&
        hasMore
      ) {
        loadMore();
      }
    }
  }, [reels.length, loading, hasMore]);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    setContainerHeight(height);
  }, []);

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: containerHeight,
      offset: containerHeight * index,
      index,
    }),
    [containerHeight]
  );

  const keyExtractor = useCallback(
    (item: any) => {
      if (item.isSkeleton) return item.id;
      return `${item.id}-${currentTab}`;
    },
    [currentTab]
  );

  const onScroll = useCallback(
    Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
      useNativeDriver: true,
    }),
    []
  );

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isAnyFullScreen, setIsAnyFullScreen] = useState(false);
  const handleModalStateChange = useCallback((isOpen: boolean) => setIsModalVisible(isOpen), []);
  const handleFullScreenChange = useCallback((isFullScreen: boolean) => setIsAnyFullScreen(isFullScreen), []);
  const handleDeleteSuccess = useCallback((postId: string) => {
    setReels(prevReels => prevReels.filter(reel => reel.id !== postId));
  }, []);

  const renderItem = useCallback(
    ({ item, index }: { item: any; index: number }) => {
      if (item.isSkeleton) {
        return <ReelSkeleton height={containerHeight} />;
      }

      const { index: scrollIndex } = scrollInfo;
      const isVisible = scrollIndex === index;

      return (
        <FeedRow
          data={item}
          isVisible={isVisible}
          height={containerHeight}
          onModalStateChange={handleModalStateChange}
          onDeleteSuccess={() => handleDeleteSuccess(item.id)}
          onFullScreenChange={handleFullScreenChange}
        />
      );
    },
    [scrollInfo, containerHeight, handleModalStateChange, handleDeleteSuccess, handleFullScreenChange]
  );

  return (
    <View style={styles.flexContainer} onLayout={handleLayout}>
      <StatusBar barStyle={'light-content'} backgroundColor={'black'} />

      {containerHeight > 0 && (
        <Animated.FlatList
          data={data}
          renderItem={renderItem}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          ref={refFlatList}
          automaticallyAdjustContentInsets
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig.current}
          onScroll={onScroll}
          keyExtractor={keyExtractor}
          getItemLayout={getItemLayout}
          removeClippedSubviews={false}
          windowSize={5}
          initialNumToRender={3}
          maxToRenderPerBatch={3}
          ListFooterComponent={null}
          decelerationRate="fast"
          bounces={false}
        />
      )}

      {!isModalVisible && !isAnyFullScreen && (
        <FeedHeader currentTab={currentTab} onTabChange={handleTabChange} />
      )}
    </View>
  );
};

export default ReelComponent;

const styles = StyleSheet.create({
  flexContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
});