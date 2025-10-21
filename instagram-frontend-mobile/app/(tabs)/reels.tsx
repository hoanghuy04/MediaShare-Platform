import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  StatusBar,
  SafeAreaView,
  Image,
} from 'react-native';
// import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@hooks/useTheme';
import { useAuth } from '@hooks/useAuth';
import { useInfiniteScroll } from '@hooks/useInfiniteScroll';
import { postAPI } from '@services/api';
import { showAlert } from '@utils/helpers';
import { Post } from '@types';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function ReelsScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRefs = useRef<any[]>([]);

  const {
    data: posts,
    isLoading,
    loadMore,
    refresh,
  } = useInfiniteScroll({
    fetchFunc: postAPI.getExplorePosts,
    limit: 20,
    onError: error => showAlert('Error', error.message),
  });

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    // Auto-play current video
    if (videoRefs.current[currentIndex]) {
      videoRefs.current[currentIndex].playAsync();
    }
  }, [currentIndex]);

  const handleVideoPress = () => {
    setIsPlaying(!isPlaying);
    if (videoRefs.current[currentIndex]) {
      if (isPlaying) {
        videoRefs.current[currentIndex].pauseAsync();
      } else {
        videoRefs.current[currentIndex].playAsync();
      }
    }
  };

  const handleLike = async (postId: string) => {
    try {
      await postAPI.likePost(postId);
    } catch (error: any) {
      showAlert('Error', error.message);
    }
  };

  const handleShare = () => {
    // Implement share functionality
  };

  const handleComment = () => {
    // Navigate to comments
  };

  const renderReelItem = ({ item, index }: { item: Post; index: number }) => {
    const isCurrentVideo = index === currentIndex;
    
    return (
      <View style={styles.videoContainer}>
        <TouchableOpacity
          style={styles.videoWrapper}
          activeOpacity={1}
          onPress={handleVideoPress}
        >
          <Image
            source={{ uri: item.media[0]?.url || '' }}
            style={styles.video}
            resizeMode="cover"
          />
        </TouchableOpacity>

        {/* Right side interaction buttons */}
        <View style={styles.rightActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleLike(item.id)}
          >
            <Ionicons
              name={item.isLikedByCurrentUser ? 'heart' : 'heart-outline'}
              size={32}
              color={item.isLikedByCurrentUser ? '#FF3040' : 'white'}
            />
            <Text style={styles.actionText}>{item.likesCount || 0}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleComment}>
            <Ionicons name="chatbubble-outline" size={28} color="white" />
            <Text style={styles.actionText}>{item.commentsCount || 0}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
            <Ionicons name="paper-plane-outline" size={28} color="white" />
            <Text style={styles.actionText}>{item.sharesCount || 0}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="bookmark-outline" size={28} color="white" />
            <Text style={styles.actionText}>{item.bookmarksCount || 0}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="ellipsis-horizontal" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Bottom content */}
        <View style={styles.bottomContent}>
          <View style={styles.userInfo}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {item.author.username.charAt(0).toUpperCase()}
                </Text>
              </View>
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.username}>{item.author.username}</Text>
              <TouchableOpacity style={styles.followButton}>
                <Text style={styles.followButtonText}>Follow</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.caption} numberOfLines={3}>
            {item.caption}
          </Text>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatusBar barStyle="light-content" backgroundColor="black" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading reels...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="black" />
      <SafeAreaView style={styles.safeArea}>
        {/* Top tabs */}
        <View style={styles.topTabs}>
          <TouchableOpacity style={styles.tabActive}>
            <Text style={styles.tabTextActive}>Reels</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab}>
            <Text style={styles.tabText}>Bạn bè</Text>
          </TouchableOpacity>
        </View>

        {/* Video list */}
        <View style={styles.videoList}>
          {posts?.map((item, index) => (
            <View key={item.id} style={styles.videoItem}>
              {renderReelItem({ item, index })}
            </View>
          ))}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
  },
  topTabs: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tab: {
    marginRight: 24,
  },
  tabActive: {
    marginRight: 24,
    borderBottomWidth: 2,
    borderBottomColor: 'white',
    paddingBottom: 4,
  },
  tabText: {
    color: '#8e8e8e',
    fontSize: 16,
    fontWeight: '600',
  },
  tabTextActive: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  videoList: {
    flex: 1,
  },
  videoItem: {
    width: screenWidth,
    height: screenHeight - 100, // Account for top tabs and bottom navigation
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  videoWrapper: {
    flex: 1,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  rightActions: {
    position: 'absolute',
    right: 16,
    bottom: 100,
    alignItems: 'center',
  },
  actionButton: {
    alignItems: 'center',
    marginBottom: 24,
  },
  actionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  bottomContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 80, // Leave space for right actions
    padding: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  userDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  username: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 12,
  },
  followButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  followButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  caption: {
    color: 'white',
    fontSize: 14,
    lineHeight: 18,
  },
});
