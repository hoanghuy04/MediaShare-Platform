import {
  Animated,
  StyleSheet,
  View,
  StatusBar,
  ActivityIndicator,
  LayoutChangeEvent,
} from 'react-native';
import React, { useRef, useState, useCallback, useEffect } from 'react';
import FeedRow from './FeedRow';
import FeedHeader from './FeedHeader';
import { postService } from '../../services/post.service';
import { PostResponse } from '../../types/post.type';

const ReelComponent = () => {
  const [containerHeight, setContainerHeight] = useState(0);
  const scrollY = useRef(new Animated.Value(0)).current;

  const [currentTab, setCurrentTab] = useState<'reels' | 'friends'>('reels');

  const [reels, setReels] = useState<PostResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [scrollInfo, setScrollInfo] = useState({ isViewable: true, index: 0 });

  const refFlatList = useRef(null);
  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 80 });

  const fetchReels = async (pageNum: number, tab: 'reels' | 'friends') => {
    if (loading && pageNum > 1) return;

    setLoading(true);
    try {
      let data;

      if (tab === 'reels') {
        data = await postService.getReels(pageNum, 10);
      } else {
        data = await postService.getReels(pageNum, 10);
      }

      const newReels = data.content || [];

      if (newReels.length === 0) {
        setHasMore(false);
      } else {
        setReels(prev => {
          if (pageNum === 1) return newReels;
          return [...prev, ...newReels];
        });
      }
    } catch (error) {
      console.error('Error fetching reels:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReels(0, currentTab);
  }, []);

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

  const onViewableItemsChanged = useCallback(({ changed }) => {
    if (changed.length > 0) {
      setScrollInfo({
        isViewable: changed[0].isViewable,
        index: changed[0].index,
      });
    }
  }, []);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    setContainerHeight(height);
  }, []);

  const getItemLayout = useCallback(
    (_, index) => ({
      length: containerHeight,
      offset: containerHeight * index,
      index,
    }),
    [containerHeight]
  );

  const keyExtractor = useCallback(
    (item: PostResponse) => `${item.id}-${currentTab}`,
    [currentTab]
  );

  const onScroll = useCallback(
    Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
      useNativeDriver: true,
    }),
    []
  );

  const renderItem = useCallback(
    ({ item, index }: { item: PostResponse; index: number }) => {
      const { index: scrollIndex } = scrollInfo;
      const isNext = Math.abs(index - scrollIndex) <= 1;
      const isVisible = scrollIndex === index;

      return (
        <FeedRow
          data={item}
          index={index}
          isNext={isNext}
          isVisible={isVisible}
          height={containerHeight}
        />
      );
    },
    [scrollInfo, containerHeight]
  );

  const renderEmpty = () => {
    if (loading && page === 1) {
      return (
        <View style={[styles.centerContainer, { height: containerHeight }]}>
          <ActivityIndicator size="large" color="white" />
        </View>
      );
    }
    return null;
  };

  return (
    <View style={styles.flexContainer} onLayout={handleLayout}>
      <StatusBar barStyle={'light-content'} backgroundColor={'black'} />

      <FeedHeader currentTab={currentTab} onTabChange={handleTabChange} />

      {containerHeight > 0 && (
        <Animated.FlatList
          data={reels}
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
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loading && page > 1 ? <ActivityIndicator color="white" style={{ margin: 20 }} /> : null
          }
          ListEmptyComponent={renderEmpty}
          removeClippedSubviews={true}
          decelerationRate="fast"
          bounces={false}
          windowSize={3}
          initialNumToRender={1}
          maxToRenderPerBatch={2}
        />
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
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
});
