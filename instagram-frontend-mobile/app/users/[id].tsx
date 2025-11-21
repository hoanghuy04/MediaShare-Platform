import React, { useEffect, useState } from 'react';
import { View, FlatList, TouchableOpacity, Image, StyleSheet, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@hooks/useTheme';
import { useAuth } from '@hooks/useAuth';
import { useInfiniteScroll } from '@hooks/useInfiniteScroll';
import { Header } from '@components/common/Header';
import { ProfileHeader } from '@components/profile/ProfileHeader';
import { LoadingSpinner } from '@components/common/LoadingSpinner';
import { userAPI, postAPI } from '@services/api';
import { UserProfile, Post } from '@types';
import { showAlert } from '@utils/helpers';
import { Ionicons } from '@expo/vector-icons';
import { messageAPI } from '../../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_SIZE = (SCREEN_WIDTH - 4) / 3;

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const {
    data: posts,
    isLoading: isLoadingPosts,
    loadMore,
    refresh: refreshPosts,
  } = useInfiniteScroll({
    fetchFunc: (page, limit) => postAPI.getUserPosts(id, page, limit),
    limit: 30,
    onError: error => showAlert('Error', error.message),
  });

  useEffect(() => {
    loadProfile();
    refreshPosts();
  }, [id]);

  const loadProfile = async () => {
    try {
      const data = await userAPI.getUserProfile(id);
      setProfile(data);
    } catch (error: any) {
      showAlert('Error', error.message);
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  console.log('profile', profile);
  const handleFollow = async () => {
    if (!profile) return;

    try {
      if (profile.isFollowing) {
        await userAPI.unfollowUser(id);
        setProfile({
          ...profile,
          isFollowing: false,
          followersCount: (profile.followersCount || 0) - 1,
        });
      } else {
        await userAPI.followUser(id);
        setProfile({
          ...profile,
          isFollowing: true,
          followersCount: (profile.followersCount || 0) + 1,
        });
      }
    } catch (error: any) {
      showAlert('Error', error.message);
    }
  };

  const handleMessage = async () => {
    // Navigate directly to conversation using the user's ID as conversationId
    const convId = await messageAPI.resolveDirectByPeer(id);
    if (convId) {
      router.push({ pathname: '/messages/[conversationId]', params: { conversationId: convId } });
    } else {
      router.push({
        pathname: '/messages/[conversationId]',
        params: { conversationId: id, isNewConversation: 'true', direction: 'sent', senderId: currentUser.id, receiverId: id },
      });
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

  // Add postsCount to profile
  const profileWithPosts = {
    ...profile,
    postsCount: posts?.length || profile.postsCount || 0,
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
      <Header showBack title={profile.username} />
      <FlatList
        data={posts}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        numColumns={3}
        columnWrapperStyle={styles.row}
        ListHeaderComponent={
          <ProfileHeader
            profile={profileWithPosts}
            isOwnProfile={isOwnProfile}
            onFollow={handleFollow}
            onMessage={handleMessage}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={isLoadingPosts ? <LoadingSpinner /> : null}
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
