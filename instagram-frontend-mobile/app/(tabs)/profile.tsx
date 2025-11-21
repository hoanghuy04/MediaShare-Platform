import React, { useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Image, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@hooks/useTheme';
import { useAuth } from '@hooks/useAuth';
import { useInfiniteScroll } from '@hooks/useInfiniteScroll';
import { Header } from '@components/common/Header';
import { ProfileHeader } from '@components/profile/ProfileHeader';
import { LoadingSpinner } from '@components/common/LoadingSpinner';
import { postService } from '../../services/post.service';
import { showAlert } from '@utils/helpers';
import { Post } from '@types';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_SIZE = (SCREEN_WIDTH - 4) / 3;

export default function ProfileScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { user, logout } = useAuth();

  const {
    data: posts,
    isLoading,
    loadMore,
    refresh,
  } = useInfiniteScroll({
    fetchFunc: (page, limit) => postService.getUserPosts(user?.id || '', page, limit),
    limit: 30,
    onError: error => showAlert('Error', error.message),
  });

  useEffect(() => {
    if (user?.id) {
      refresh();
    }
  }, [user?.id]);

  const handleEdit = () => {
    // TODO: Navigate to edit profile screen
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

  const renderItem = ({ item }: { item: Post }) => (
    <TouchableOpacity style={styles.gridItem} onPress={() => router.push(`/posts/${item.id}`)}>
      <Image source={{ uri: item.media?.[0]?.url }} style={styles.image} resizeMode="cover" />
      {item.media && item.media.length > 1 && (
        <View style={styles.multipleIcon}>
          <Ionicons name="copy-outline" size={18} color="white" />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header title={user.username} rightIcon="menu" onRightPress={handleLogout} />
      <FlatList
        data={posts}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        numColumns={3}
        columnWrapperStyle={styles.row}
        ListHeaderComponent={<ProfileHeader profile={userProfile} isOwnProfile onEdit={handleEdit} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={isLoading ? <LoadingSpinner /> : null}
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
});
