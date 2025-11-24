import React, { useEffect, useState } from 'react';
import { View, FlatList, TouchableOpacity, Image, StyleSheet, Dimensions, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@hooks/useTheme';
import { useAuth } from '@hooks/useAuth';
import { useInfiniteScroll } from '@hooks/useInfiniteScroll';
import { Header } from '@components/common/Header';
import { ProfileHeader } from '@components/profile/ProfileHeader';
import { LoadingSpinner } from '@components/common/LoadingSpinner';
import { userAPI } from '@services/api';
import { postService } from '../../services/post.service';
import { UserResponse, Post } from '@types';
import { showAlert } from '@utils/helpers';
import { Ionicons } from '@expo/vector-icons';
import { userService } from '../../services/user.service';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_SIZE = (SCREEN_WIDTH - 4) / 3;

type TabType = 'posts' | 'reels' | 'tagged';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('posts');

  const {
    data: posts,
    isLoading: isLoadingPosts,
    loadMore: loadMorePosts,
    refresh: refreshPosts,
  } = useInfiniteScroll({
    fetchFunc: (page, limit) => postService.getUserPosts(id, page, limit),
    limit: 30,
    onError: error => showAlert('Error', error.message),
  });

  const {
    data: reels,
    isLoading: isLoadingReels,
    loadMore: loadMoreReels,
    refresh: refreshReels,
  } = useInfiniteScroll({
    fetchFunc: (page, limit) => postService.getUserReels(id, page, limit),
    limit: 30,
    onError: error => showAlert('Error', error.message),
  });

  useEffect(() => {
    loadProfile();
    if (activeTab === 'posts') {
      refreshPosts();
    } else if (activeTab === 'reels') {
      refreshReels();
    }
  }, [id, activeTab]);

  const loadProfile = async () => {
    try {
      const data = await userService.getUserById(id);

      setProfile(data);
    } catch (error: any) {
      showAlert('Error', error.message);
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !profile) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Header showBack />
        <LoadingSpinner />
      </View>
    );
  }

  const isOwnProfile = currentUser?.id === id;

  const profileWithPosts = {
    ...profile,
    postsCount: posts?.length || profile.postsCount || 0,
  };

  const renderItem = ({ item }: { item: Post }) => (
    <TouchableOpacity
      style={styles.gridItem}
      onPress={() =>
        router.push({
          pathname: '/profile/posts',
          params: { userId: id, postId: item.id },
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

  const renderTabMenu = () => (
    <View style={[styles.tabMenu, { borderBottomColor: theme.colors.border }]}>
      <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('posts')}>
        <Ionicons
          name="grid"
          size={24}
          color={activeTab === 'posts' ? theme.colors.text : theme.colors.textSecondary}
        />
        {activeTab === 'posts' && (
          <View style={[styles.tabIndicator, { backgroundColor: theme.colors.text }]} />
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('reels')}>
        <Ionicons
          name="play-circle"
          size={24}
          color={activeTab === 'reels' ? theme.colors.text : theme.colors.textSecondary}
        />
        {activeTab === 'reels' && (
          <View style={[styles.tabIndicator, { backgroundColor: theme.colors.text }]} />
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('tagged')}>
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
    const isLoadingData = activeTab === 'posts' ? isLoadingPosts : isLoadingReels;
    const loadMore = activeTab === 'posts' ? loadMorePosts : loadMoreReels;

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
          isLoadingData ? (
            <LoadingSpinner />
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
      <Header showBack title={profile.username} />
      <FlatList
        data={[{ id: 'header' }]}
        renderItem={() => null}
        keyExtractor={item => item.id}
        ListHeaderComponent={
          <>
            <ProfileHeader
              profile={profileWithPosts}
              isOwnProfile={isOwnProfile}
            />
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
