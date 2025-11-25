import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Dimensions,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { useTheme } from '../../hooks/useTheme';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import { postService } from '../../services/post.service';
import { showAlert } from '../../utils/helpers';
import { Post } from '../../types';

const { width: screenWidth } = Dimensions.get('window');
const itemSize = (screenWidth - 4) / 3; // 3 columns with 2px gaps

export default function ExploreScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [videoThumbnails, setVideoThumbnails] = useState<{ [key: string]: string }>({});

  const {
    data: posts,
    isLoading,
    hasMore,
    loadMore,
    refresh,
  } = useInfiniteScroll({
    fetchFunc: postService.getExplorePosts,
    limit: 30,
    onError: error => showAlert('Error', error.message),
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    refresh();
  }, []);

  const handleSearchPress = () => {
    router.push('/search');
  };

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await refresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const generateThumbnail = async (item: Post) => {
    const videoMedia = item.media?.find(m => m.category === 'VIDEO' || m.category === 'video');
    const imageMedia = item.media?.find(m => m.category === 'IMAGE' || m.category === 'image');
    
    if (videoMedia && !videoThumbnails[item.id] && !imageMedia) {
      try {
        const { uri } = await VideoThumbnails.getThumbnailAsync(videoMedia.url, { time: 0 });
        setVideoThumbnails(prev => ({ ...prev, [item.id]: uri }));
      } catch (error) {
        console.log('Error generating thumbnail for', item.id, error);
      }
    }
  };

  const ExploreGridItem = ({ item }: { item: Post }) => {
    const isReel = item.type === 'REEL';
    const hasMultipleMedia = item.media.length > 1;

    // Generate thumbnail for reels
    React.useEffect(() => {
      if (isReel) {
        generateThumbnail(item);
      }
    }, [item.id]);

    // Get thumbnail URL - match ReelGrid logic exactly
    const videoMedia = item.media?.find(m => m.category === 'VIDEO' || m.category === 'video');
    const imageMedia = item.media?.find(m => m.category === 'IMAGE' || m.category === 'image');
    const thumbnailUri = videoThumbnails[item.id] || imageMedia?.url || videoMedia?.url || item.media?.[0]?.url;

    return (
      <TouchableOpacity
        style={[styles.gridItem, { width: itemSize, height: itemSize }]}
        onPress={() => {
          if (isReel) {
            router.push({
              pathname: '/profile/reels',
              params: { userId: item.author.id, reelId: item.id }
            });
          } else {
            router.push({
              pathname: '/profile/posts',
              params: { userId: item.author.id, postId: item.id }
            });
          }
        }}
        activeOpacity={0.9}
      >
        <Image
          source={{ uri: thumbnailUri }}
          style={styles.gridImage}
          resizeMode="cover"
        />

        {isReel && (
          <View style={styles.videoIndicator}>
            <Ionicons name="play" size={14} color="white" />
          </View>
        )}

        {hasMultipleMedia && (
          <View style={styles.multipleIndicator}>
            <Ionicons name="copy-outline" size={14} color="white" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderGridItem = ({ item }: { item: Post; index: number }) => {
    return <ExploreGridItem item={item} />;
  };

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }
    return (
      <View style={styles.centerContainer}>
        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
          Chưa có bài viết nào trong mục Khám phá
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      {/* Header + ô search */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Khám phá
        </Text>
        <TouchableOpacity
          style={styles.searchBar}
          onPress={handleSearchPress}
          activeOpacity={0.9}
        >
          <Ionicons
            name="search"
            size={18}
            color="#8e8e8e"
            style={styles.searchIcon}
          />
          <Text style={styles.searchPlaceholder}>Tìm kiếm</Text>
        </TouchableOpacity>
      </View>

      {/* Grid posts */}
      <FlatList
        data={(posts as Post[]) || []}
        renderItem={renderGridItem}
        keyExtractor={item => item.id}
        numColumns={3}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.gridContainer}
        onEndReached={hasMore ? loadMore : undefined}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
            progressViewOffset={8}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    paddingTop: 4,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f4f4f5',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 15,
    color: '#8e8e8e',
  },
  gridContainer: {
    paddingTop: 6,
    paddingBottom: 16,
    paddingHorizontal: 4,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 4,
    gap: 4,
  },
  gridItem: {
    backgroundColor: '#f3f4f6',
    position: 'relative',
    borderRadius: 4,
    overflow: 'hidden',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  videoIndicator: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  multipleIndicator: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
  },
});
