import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  Alert,
  StatusBar,
  Platform,
  SafeAreaView,

} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
// import { Video, ResizeMode } from 'expo-av'; 
import * as MediaLibrary from 'expo-media-library';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@hooks/useTheme';
import { useAuth } from '@hooks/useAuth';
import { useInfiniteScroll } from '@hooks/useInfiniteScroll';
import { usePostCreation } from '@hooks/usePostCreation';
import { postAPI } from '@services/api';
import { showAlert } from '@utils/helpers';
import { Post } from '@types';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function ReelsScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { showPostCreation } = usePostCreation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [hasPhotosPermission, setHasPhotosPermission]  = useState(false);
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


  // Check and request Photos Library permission on iOS
  useEffect(() => {
    const checkPhotosPermission = async () => {
      if (Platform.OS === 'ios') {
        try {
          const { status } = await MediaLibrary.getPermissionsAsync();
          if (status === 'granted') {
            setHasPhotosPermission(true);
          } else {
            const { status: newStatus } = await MediaLibrary.requestPermissionsAsync();
            setHasPhotosPermission(newStatus === 'granted');
            if (newStatus !== 'granted') {
              showAlert(
                'Quyền truy cập Photos',
                'Vui lòng cấp quyền truy cập Photos Library để hiển thị ảnh từ thư viện.'
              );
            }
          }
        } catch (error) {
          console.warn('Error checking photos permission:', error);
        }
      } else {
        setHasPhotosPermission(true); // Android doesn't need this permission
      }
    };

    checkPhotosPermission();
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
  // thay resolveUri hiện tại bằng hàm này
const resolveUri = async (uri?: string) => {
  console.log('🔍 Resolving URI:', uri);
Alert.alert('URI debug', uri || 'No URI found');

  if (!uri) return null;

  // Nếu không phải iOS hoặc không phải ph:// thì trả về nguyên bản
  if (Platform.OS !== 'ios' || !uri.startsWith('ph://')) return uri;

  // Nếu chưa cấp quyền Photos
  try {
    const perm = await MediaLibrary.getPermissionsAsync();
    if (perm.status !== 'granted') {
      // Yêu cầu quyền (nếu bị limited, hãy mở picker)
      const { status, accessPrivileges } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Photos permission not granted');
        return null;
      }
      // Nếu accessPrivileges === 'limited', mở picker để người dùng chọn thêm
      if (accessPrivileges === 'limited') {
        // Mở hộp chọn ảnh (người dùng có thể thêm ảnh được phép)
        await MediaLibrary.presentPermissionsPickerAsync();
      }
    }
  } catch (err) {
    console.warn('Permission check failed', err);
    // tiếp tục thử resolve
  }

  // Extract assetId từ ph://<assetId>/...
  const m = uri.match(/^ph:\/\/([^/]+)/);
  const assetId = m ? m[1] : null;

  try {
    // Nếu có assetId thì lấy bằng assetId (thường ổn định hơn)
    const info = assetId
      ? await MediaLibrary.getAssetInfoAsync(assetId)
      : await MediaLibrary.getAssetInfoAsync(uri);

    // MediaLibrary đôi khi trả localUri (file://...) hoặc chỉ trả uri (ph://...). lấy localUri ưu tiên
    const local = info?.localUri || info?.uri;
    if (local && !local.startsWith('ph://')) {
      // thành công: trả file:// hoặc content:// hoặc http(s)://
      console.log('Resolved ph:// ->', local);
      return local;
    }

    // Nếu không có localUri (ví dụ file chưa download từ iCloud), thử request download bằng FileSystem (fallback)
    // LƯU Ý: phương pháp dưới đây có thể cần tuỳ chỉnh / permission tùy phiên bản.
    // Thử copy sang cache bằng expo-file-system nếu info.uri là file có thể truy cập
    try {
      // nếu info.localUri undefined nhưng info.uri tồn tại và bắt đầu bằng 'assets-library://' hoặc 'ph://', thử dùng getAssetInfoAsync lại với assetId
      if (assetId) {
        const info2 = await MediaLibrary.getAssetInfoAsync(assetId);
        const local2 = info2?.localUri || info2?.uri;
        if (local2 && !local2.startsWith('ph://')) return local2;
      }
    } catch (innerErr) {
      console.warn('Second attempt to resolve failed', innerErr);
    }

    console.warn('Could not resolve ph:// to local uri', uri);
    return null;
  } catch (error) {
    console.warn('resolveUri error:', error);
    return null;
  }
};


  const renderReelItem = ({ item, index }: { item: Post; index: number }) => {
    const isCurrentVideo = index === currentIndex;
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [imageError, setImageError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
  
    useEffect(() => {
      if (item.media && item.media.length > 0) {
        setIsLoading(true);
        setImageError(false);
        (async () => {
          try {
            const resolved = await resolveUri(item.media[0]?.url);
            setImageUri(resolved);
            setImageError(!resolved);
          } catch (error) {
            console.warn('Failed to resolve image URI:', error);
            setImageError(true);
          } finally {
            setIsLoading(false);
          }
        })();
      } else {
        setIsLoading(false);
        setImageError(true);
      }
    }, [item.media, hasPhotosPermission]);
    
    return (
      <View style={styles.videoContainer}>
        <TouchableOpacity
          style={styles.videoWrapper}
          activeOpacity={1}
          onPress={handleVideoPress}
        >
          {isLoading ? (
            <View style={[styles.video, { backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center' }]}>
              <Ionicons name="hourglass-outline" size={32} color="#666" />
              <Text style={{ color: '#666', fontSize: 14, marginTop: 8 }}>Đang tải...</Text>
            </View>
          ) : imageError || !imageUri ? (
            <View style={[styles.video, { backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center' }]}>
              <Ionicons name="image-outline" size={64} color="#666" />
              <Text style={{ color: '#666', fontSize: 16, marginTop: 8, textAlign: 'center' }}>
                {Platform.OS === 'ios' && !hasPhotosPermission 
                  ? 'Cần quyền truy cập Photos Library' 
                  : 'Không thể tải ảnh'
                }
              </Text>
            </View>
          ) : (
            <ExpoImage
              source={{ uri: imageUri }}
              style={styles.video}
              contentFit="cover"
              transition={300}
              onError={() => {
                console.warn('ExpoImage failed to load:', imageUri);
                setImageError(true);
              }}
              placeholder="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
            />
          )}
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
          <TouchableOpacity style={styles.createPostButton} onPress={showPostCreation}>
            <Ionicons name="add" size={24} color="white" />
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
  createPostButton: {
    marginLeft: 'auto',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#3897f0',
    borderRadius: 20,
  },
});
