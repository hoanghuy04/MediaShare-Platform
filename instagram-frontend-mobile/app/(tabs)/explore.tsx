import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  SafeAreaView,
  Dimensions,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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

  useEffect(() => {
    refresh();
  }, []);

  const handleSearchPress = () => {
    // Navigate to search page immediately to show recent searches
    router.push('/search');
  };


  const renderGridItem = ({ item, index }: { item: Post; index: number }) => {
    const firstMedia = item.media[0];
    const isVideo = firstMedia?.type === 'VIDEO' || firstMedia?.type === 'video';
    const hasMultipleMedia = item.media.length > 1;
    
    return (
      <TouchableOpacity
        style={[styles.gridItem, { width: itemSize, height: itemSize }]}
        onPress={() => router.push(`/posts/${item.id}`)}
      >
        <Image
          source={{ uri: firstMedia?.url }}
          style={styles.gridImage}
          resizeMode="cover"
        />
        
        {/* Video indicator */}
        {isVideo && (
          <View style={styles.videoIndicator}>
            <Ionicons name="play" size={16} color="white" />
          </View>
        )}
        
        {/* Multiple media indicator */}
        {hasMultipleMedia && (
          <View style={styles.multipleIndicator}>
            <Ionicons name="albums" size={16} color="white" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      <SafeAreaView style={styles.safeArea}>
        {/* Top search bar */}
        <View style={styles.searchContainer}>
          <TouchableOpacity style={styles.searchBar} onPress={handleSearchPress}>
            <Ionicons name="search" size={20} color="#8e8e8e" style={styles.searchIcon} />
            <Text style={styles.searchPlaceholder}>Tìm kiếm</Text>
          </TouchableOpacity>
        </View>

        {/* Show posts grid */}
        <FlatList
          data={posts as Post[] || []}
          renderItem={renderGridItem}
          keyExtractor={item => item.id}
          numColumns={3}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.gridContainer}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  safeArea: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 16,
    color: '#8e8e8e',
  },
  gridContainer: {
    paddingTop: 8,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  gridItem: {
    backgroundColor: '#f0f0f0',
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  videoIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    padding: 4,
  },
  multipleIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    padding: 4,
  },
  listContainer: {
    paddingVertical: 8,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
  },
  fullName: {
    fontSize: 14,
    marginTop: 2,
  },
  verified: {
    fontSize: 16,
    color: '#1DA1F2',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
