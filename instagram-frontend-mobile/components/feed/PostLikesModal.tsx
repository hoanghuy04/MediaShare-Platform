import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
  Dimensions,
} from 'react-native';
import { Ionicons, Feather, Octicons } from '@expo/vector-icons';
import { useTheme } from '@hooks/useTheme';
import { Avatar } from '../common/Avatar';
import { postLikeService } from '@/services/post-like.service';
import { PostLikeUserResponse } from '@/types/post.type';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
  Easing,
} from 'react-native-reanimated';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const SNAP_TOP = 0;
const SNAP_HALF = SCREEN_HEIGHT * 0.4;
const SNAP_CLOSE = SCREEN_HEIGHT;

interface PostLikesModalProps {
  visible: boolean;
  postId: string;
  onClose: () => void;
}

export const PostLikesModal: React.FC<PostLikesModalProps> = ({
  visible,
  postId,
  onClose,
}) => {
  const { theme } = useTheme();
  const [likes, setLikes] = useState<PostLikeUserResponse[]>([]);
  const [filteredLikes, setFilteredLikes] = useState<PostLikeUserResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const translateY = useSharedValue(SNAP_CLOSE);
  const context = useSharedValue({ y: 0 });

  useEffect(() => {
    if (visible) {
      translateY.value = SNAP_CLOSE;
      scrollTo(SNAP_HALF);
      loadLikes();
    } else {
      setSearchQuery('');
    }
  }, [visible, postId]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = likes.filter(user =>
        user.username.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredLikes(filtered);
    } else {
      setFilteredLikes(likes);
    }
  }, [searchQuery, likes]);

  const loadLikes = async () => {
    try {
      setIsLoading(true);
      const response = await postLikeService.getPostLikes(postId, 0, 100);
      setLikes(response.content);
      setFilteredLikes(response.content);
    } catch (error) {
      console.error('Error loading likes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const scrollTo = useCallback((destination: number) => {
    'worklet';
    translateY.value = withSpring(destination, {
      damping: 50,
      stiffness: 300,
      mass: 1,
      overshootClamping: true,
    });
  }, []);

  const handleClose = useCallback(() => {
    'worklet';
    translateY.value = withTiming(SNAP_CLOSE, {
      duration: 250,
      easing: Easing.out(Easing.quad),
    }, (finished) => {
      if (finished) {
        runOnJS(onClose)();
      }
    });
  }, [onClose]);

  const gesture = Gesture.Pan()
    .onStart(() => {
      context.value = { y: translateY.value };
    })
    .onUpdate((event) => {
      let newY = event.translationY + context.value.y;

      if (newY < SNAP_TOP) {
        newY = SNAP_TOP + (newY - SNAP_TOP) * 0.2;
      }

      translateY.value = newY;
    })
    .onEnd((event) => {
      const { velocityY } = event;
      const currentY = translateY.value;

      // Logic for snapping
      if (velocityY > 1000) {
        // Fast fling down
        if (currentY > SNAP_HALF + 100) {
          handleClose();
        } else {
          scrollTo(SNAP_HALF);
        }
      } else if (velocityY < -1000) {
        // Fast fling up
        if (currentY < SNAP_HALF - 100) {
          scrollTo(SNAP_TOP);
        } else {
          scrollTo(SNAP_HALF);
        }
      } else {
        if (currentY < SNAP_HALF / 2) {
          scrollTo(SNAP_TOP);
        } else if (currentY < (SNAP_HALF + SNAP_CLOSE) / 2) {
          scrollTo(SNAP_HALF);
        } else {
          handleClose();
        }
      }
    });

  const rStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  const backdropStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        translateY.value,
        [SNAP_HALF, SNAP_CLOSE * 0.7],
        [1, 0],
        Extrapolation.CLAMP
      ),
    };
  });

  const renderLikeItem = ({ item }: { item: PostLikeUserResponse }) => (
    <View style={[styles.likeItem, { borderBottomColor: theme.colors.border }]}>
      <Avatar uri={item.avatarUrl} name={item.username} size={44} />
      <View style={styles.userInfo}>
        <Text style={[styles.username, { color: theme.colors.text }]}>
          {item.username}
        </Text>
        <Text style={[styles.fullName, { color: theme.colors.textSecondary }]}>
          {item.username}
        </Text>
      </View>
      <TouchableOpacity style={[styles.followButton, { backgroundColor: theme.colors.primary }]}>
        <Text style={styles.followButtonText}>Theo dõi</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <GestureHandlerRootView style={styles.modalOverlay}>
        <Animated.View style={[styles.backdrop, backdropStyle]} />
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={handleClose}
        />

        <GestureDetector gesture={gesture}>
          <Animated.View
            style={[
              styles.modalContent,
              { backgroundColor: theme.colors.background },
              rStyle,
              { height: SCREEN_HEIGHT }
            ]}
          >
            <View style={styles.dragHandleArea}>
              <View style={styles.handleBarContainer}>
                <View style={[styles.handleBar, { backgroundColor: theme.colors.border }]} />
              </View>

              <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
                  Lượt thích
                </Text>
              </View>
            </View>

            <View style={[styles.searchContainer, { backgroundColor: theme.colors.border }]}>
              <Ionicons name="search" size={20} color={theme.colors.textSecondary} style={styles.searchIcon} />
              <TextInput
                style={[styles.searchInput, { color: theme.colors.text }]}
                placeholder="Tìm kiếm"
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor={theme.colors.textSecondary}
              />
            </View>

            <View style={styles.listWrapper}>
              {isLoading ? (
                <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
              ) : (
                <FlatList
                  data={filteredLikes}
                  renderItem={renderLikeItem}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.listContent}
                  showsVerticalScrollIndicator={false}
                  ListFooterComponent={<View style={{ height: 150 }} />}
                />
              )}
            </View>
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    position: 'absolute',
    width: '100%',
    top: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    overflow: 'hidden',
  },
  dragHandleArea: {
    paddingBottom: 10,
  },
  handleBarContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 12,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    height: '100%',
  },
  listWrapper: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
  },
  loader: {
    marginTop: 40,
  },
  likeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  username: {
    fontSize: 15,
    fontWeight: '600',
  },
  fullName: {
    fontSize: 13,
  },
  followButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  followButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
