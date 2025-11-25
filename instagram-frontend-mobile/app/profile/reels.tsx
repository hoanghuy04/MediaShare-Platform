import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  Animated,
  LayoutChangeEvent,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@hooks/useAuth';
import { postService } from '@/services/post.service';
import { showAlert } from '@utils/helpers';
import { PostResponse } from '@/types/post.type';
import FeedRow from '@/components/reels/FeedRow';
import ReelSkeleton from '@/components/reels/ReelSkeleton';
import { SafeAreaView } from 'react-native-safe-area-context';

const REELS_PER_PAGE = 10;
const PREFETCH_THRESHOLD = 3;

export default function UserReelsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const scrollY = useRef(new Animated.Value(0)).current;
  const refFlatList = useRef<Animated.FlatList>(null);
  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 });
  const hasInitialized = useRef(false);

  const userId = params.userId as string || user?.id;
  const selectedReelId = params.reelId as string;

  const [containerHeight, setContainerHeight] = useState(0);
  const [reels, setReels] = useState<PostResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [scrollInfo, setScrollInfo] = useState({ isViewable: true, index: 0 });
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isAnyFullScreen, setIsAnyFullScreen] = useState(false);

  const fetchReels = async (pageNum: number) => {
    if (loading) return;
    setLoading(true);
    try {
      const response = await postService.getUserReels(userId, pageNum, REELS_PER_PAGE);
      const newReels = response.content || [];

      if (newReels.length < REELS_PER_PAGE) setHasMore(false);

      setReels(prev => {
        if (pageNum === 0) return newReels;
        const existingIds = new Set(prev.map(r => r.id));
        const uniqueNewReels = newReels.filter(r => !existingIds.has(r.id));
        return [...prev, ...uniqueNewReels];
      });
    } catch (error: any) {
      console.error('Error fetching user reels:', error);
      showAlert('Lỗi', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId && !hasInitialized.current) {
      hasInitialized.current = true;
      fetchReels(0);
    }
  }, [userId]);

  useFocusEffect(
    React.useCallback(() => {
      if (hasInitialized.current) {
        console.log('[UserReels] useFocusEffect: Refreshing reels for userId:', userId);
        setReels([]);
        setPage(0);
        setHasMore(true);
        fetchReels(0);
      }
    }, [userId])
  );

  // Scroll to selected reel after data loads
  useEffect(() => {
    if (selectedReelId && reels.length > 0 && containerHeight > 0) {
      const index = reels.findIndex(reel => reel.id === selectedReelId);
      if (index !== -1) {
        setTimeout(() => {
          refFlatList.current?.scrollToIndex({
            index,
            animated: false,
          });
        }, 300);
      }
    }
  }, [selectedReelId, reels.length, containerHeight]);

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchReels(nextPage);
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

  const keyExtractor = useCallback((item: any) => {
    if (item.isSkeleton) return item.id;
    return item.id;
  }, []);

  const onScroll = useCallback(
    Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
      useNativeDriver: true,
    }),
    []
  );

  const handleModalStateChange = useCallback((isOpen: boolean) => setIsModalVisible(isOpen), []);
  const handleFullScreenChange = useCallback((isFullScreen: boolean) => setIsAnyFullScreen(isFullScreen), []);
  const handleDeleteSuccess = useCallback((postId: string) => {
    setReels(prevReels => prevReels.filter(reel => reel.id !== postId));
  }, []);

  const handleScrollToIndexFailed = (info: {
    index: number;
    highestMeasuredFrameIndex: number;
    averageItemLength: number;
  }) => {
    setTimeout(() => {
      refFlatList.current?.scrollToIndex({
        index: info.index,
        animated: false,
      });
    }, 100);
  };

  const data = React.useMemo(() => {
    if (reels.length === 0 && loading) {
      return Array.from({ length: 3 }).map((_, i) => ({ id: `initial-${i}`, isSkeleton: true }));
    }
    if (hasMore) {
      return [...reels, { id: 'sticky-skeleton-loader', isSkeleton: true }];
    }
    return reels;
  }, [reels, loading, hasMore]);

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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="black" />
      <View style={styles.flexContainer} onLayout={handleLayout}>
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
            onScrollToIndexFailed={handleScrollToIndexFailed}
          />
        )}

        {!isModalVisible && !isAnyFullScreen && (
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={28} color="white" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  flexContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  header: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  backButton: {
    position: 'absolute',
    top: 0,
    left: 16,
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
  },
});
