import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Image, Dimensions, Text } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { useTheme } from '@hooks/useTheme';
import { useAuth } from '@hooks/useAuth';
import { useInfiniteScroll } from '@hooks/useInfiniteScroll';
import { Header } from '@components/common/Header';
import { ProfileHeader } from '@components/profile/ProfileHeader';
import { ProfileHeaderSkeleton } from '@components/profile/ProfileHeaderSkeleton';
import { ProfileGridSkeleton } from '@components/profile/ProfileGridSkeleton';
import { LoadingSpinner } from '@components/common/LoadingSpinner';
import { postService } from '../../services/post.service';
import { showAlert } from '@utils/helpers';
import { Post } from '@types';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_SIZE = (SCREEN_WIDTH - 4) / 3;

type TabType = 'posts' | 'reels' | 'tagged';

interface ReelGridItemProps {
  item: Post;
  userId?: string;
  videoThumbnails: { [key: string]: string };
  onThumbnailGenerated: (itemId: string, uri: string) => void;
}

const ReelGridItem: React.FC<ReelGridItemProps> = ({ item, userId, videoThumbnails, onThumbnailGenerated }) => {
  const router = useRouter();
  const videoMedia = item.media?.find(m => m.category === 'VIDEO' || m.type === 'VIDEO' || m.type === 'video');
  const imageMedia = item.media?.find(m => m.category === 'IMAGE');
  const isVideo = !!videoMedia;
  
  // Use cached thumbnail, image thumbnail, or video URL
  const thumbnailUri = videoThumbnails[item.id] || imageMedia?.url || videoMedia?.url || item.media?.[0]?.url;

  // Generate thumbnail for video if not cached
  React.useEffect(() => {
    if (isVideo && videoMedia && !videoThumbnails[item.id] && !imageMedia) {
      VideoThumbnails.getThumbnailAsync(videoMedia.url, {
        time: 0,
      })
        .then(({ uri }) => {
          onThumbnailGenerated(item.id, uri);
        })
        .catch(error => {
          console.log('Error generating thumbnail for', item.id, error);
        });
    }
  }, [item.id, isVideo, videoMedia, imageMedia]);
  
  return (
    <TouchableOpacity
      style={styles.gridItem}
      onPress={() =>
        router.push({
          pathname: '/profile/reels',
          params: { userId, reelId: item.id },
        })
      }
    >
      <Image source={{ uri: thumbnailUri }} style={styles.image} resizeMode="cover" />
      {/* Video indicator */}
      {isVideo && (
        <View style={styles.videoIndicator}>
          <Ionicons name="play" size={16} color="white" />
        </View>
      )}
      {/* View count overlay */}
      <View style={styles.viewCountOverlay}>
        <Ionicons name="play" size={12} color="white" />
        <Text style={styles.viewCountText}>{item.totalLike || 0}</Text>
      </View>
    </TouchableOpacity>
  );
};

export default function ProfileScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { user, logout, refreshUserData } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('posts');
  const [videoThumbnails, setVideoThumbnails] = useState<{ [key: string]: string }>({});

  const {
    data: posts,
    isLoading: isLoadingPosts,
    loadMore: loadMorePosts,
    refresh: refreshPosts,
  } = useInfiniteScroll({
    fetchFunc: (page, limit) => postService.getUserPosts(user?.id || '', page, limit),
    limit: 30,
    onError: error => showAlert('Error', error.message),
  });

  const {
    data: reels,
    isLoading: isLoadingReels,
    loadMore: loadMoreReels,
    refresh: refreshReels,
  } = useInfiniteScroll({
    fetchFunc: (page, limit) => postService.getUserReels(user?.id || '', page, limit),
    limit: 30,
    onError: error => showAlert('Error', error.message),
  });

  useEffect(() => {
    if (user?.id) {
      if (activeTab === 'posts') {
        refreshPosts();
      } else if (activeTab === 'reels') {
        refreshReels();
      }
    }
  }, [user?.id, activeTab]);

  useFocusEffect(
    React.useCallback(() => {
      if (user?.id) {
        refreshUserData();
        if (activeTab === 'posts') {
          refreshPosts();
        } else if (activeTab === 'reels') {
          refreshReels();
        }
      }
    }, [user?.id, activeTab])
  );

  const handleEdit = () => {
    router.push('/profile/edit-profile');
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error: any) {
      showAlert('Error', error.message);
    }
  };

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <LoadingSpinner />
      </View>
    );
  }

  const userProfile = {
    ...user,
    postsCount: posts?.length || 0,
    followersCount: user.followersCount || 0,
    followingCount: user.followingCount || 0,
  };

  const renderPostItem = ({ item }: { item: Post }) => (
    <TouchableOpacity
      style={styles.gridItem}
      onPress={() =>
        router.push({
          pathname: '/profile/posts',
          params: { userId: user?.id, postId: item.id },
        })
      }
    >
      <Image source={{ uri: item.media?.[0]?.url }} style={styles.image} resizeMode="cover" />
      {item.media && item.media.length > 1 && (
        <View style={styles.multipleIcon}>
          <Ionicons name="copy-outline" size={18} color="white" />
        </View>
      )}
    </TouchableOpacity>
  );

  const renderReelItem = ({ item }: { item: Post }) => (
    <ReelGridItem
      item={item}
      userId={user?.id}
      videoThumbnails={videoThumbnails}
      onThumbnailGenerated={(itemId, uri) => {
        setVideoThumbnails(prev => ({ ...prev, [itemId]: uri }));
      }}
    />
  );

  const renderTabMenu = () => (
    <View style={[styles.tabMenu, { borderBottomColor: theme.colors.border }]}>
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => setActiveTab('posts')}
      >
        <Ionicons
          name="grid"
          size={24}
          color={activeTab === 'posts' ? theme.colors.text : theme.colors.textSecondary}
        />
        {activeTab === 'posts' && (
          <View style={[styles.tabIndicator, { backgroundColor: theme.colors.text }]} />
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => setActiveTab('reels')}
      >
        <Ionicons
          name="play-circle"
          size={24}
          color={activeTab === 'reels' ? theme.colors.text : theme.colors.textSecondary}
        />
        {activeTab === 'reels' && (
          <View style={[styles.tabIndicator, { backgroundColor: theme.colors.text }]} />
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => setActiveTab('tagged')}
      >
        <Ionicons
          name="person-outline"
          size={24}
          color={activeTab === 'tagged' ? theme.colors.text : theme.colors.textSecondary}
        />
        {activeTab === 'tagged' && (
          <View style={[styles.tabIndicator, { backgroundColor: theme.colors.text }]} />
        )}
      </TouchableOpacity>
    </View>
  );

  const renderContent = () => {
    if (activeTab === 'tagged') {
      return (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            Chưa có bài viết được gắn thẻ
          </Text>
        </View>
      );
    }

    const data = activeTab === 'posts' ? posts : reels;
    const isLoading = activeTab === 'posts' ? isLoadingPosts : isLoadingReels;
    const loadMore = activeTab === 'posts' ? loadMorePosts : loadMoreReels;
    const renderItem = activeTab === 'posts' ? renderPostItem : renderReelItem;

    return (
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        numColumns={3}
        columnWrapperStyle={styles.row}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          isLoading ? (
            <ProfileGridSkeleton itemCount={9} />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                {activeTab === 'posts' ? 'Chưa có bài viết' : 'Chưa có thước phim'}
              </Text>
            </View>
          )
        }
      />
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header title={user?.username || ''} rightIcon="menu" onRightPress={handleLogout} />
      <FlatList
        data={[{ id: 'header' }]}
        renderItem={() => null}
        keyExtractor={item => item.id}
        ListHeaderComponent={
          <>
            {user ? (
              <ProfileHeader profile={userProfile} isOwnProfile onEdit={handleEdit} />
            ) : (
              <ProfileHeaderSkeleton />
            )}
            {renderTabMenu()}
          </>
        }
        ListFooterComponent={renderContent()}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  row: {
    gap: 2,
  },
  gridItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    marginBottom: 2,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  multipleIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  videoIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    padding: 4,
  },
  viewCountOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewCountText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  tabMenu: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    position: 'relative',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
});
