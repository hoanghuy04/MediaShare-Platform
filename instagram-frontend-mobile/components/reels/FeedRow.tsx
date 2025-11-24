import { StyleSheet, View, Animated } from 'react-native';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import React, { useRef, useState } from 'react';
import VideoComponent from './VideoComponent';
import FeedFooter from './FeedFooter';
import FeedSideBar from './FeedSideBar';
import LikesModal from './LikesModal';
import { PostResponse } from '../../types/post.type';
import { AntDesign, Ionicons } from '@expo/vector-icons';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { postLikeService } from '../../services/post-like.service';
import CommentsModal from './CommentsModal';
import { Toast } from '../common/Toast';
import { UserSummaryResponse } from '../../types/user';

interface FeedRowProps {
  data: PostResponse;
  isVisible: boolean;
  height: number;
  onModalStateChange?: (isOpen: boolean) => void;
  onDeleteSuccess?: () => void;
  onFullScreenChange?: (isFullScreen: boolean) => void;
}

interface HeartItem {
  id: number;
  x?: number;
  y?: number;
}

const AnimatedHeart = ({ x, y, onComplete }: { x?: number; y?: number; onComplete: () => void }) => {
  const scale = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const gradientColors = React.useMemo(() => {
    const gradients: readonly [string, string, ...string[]][] = [
      ['#962FBF', '#D62976', '#FA7E1E', '#FEDA75'],
      ['#FF3E00', '#FFB700'],
    ];
    return gradients[Math.floor(Math.random() * gradients.length)];
  }, []);

  React.useEffect(() => {
    scale.setValue(0);
    rotate.setValue(0);
    opacity.setValue(1);

    const animation = Animated.sequence([
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1.2,
          useNativeDriver: true,
          speed: 60,
          bounciness: 20,
        }),
        Animated.sequence([
          Animated.delay(50),
          Animated.timing(rotate, { toValue: -1, duration: 40, useNativeDriver: true }),
          Animated.timing(rotate, { toValue: 1, duration: 40, useNativeDriver: true }),
          Animated.timing(rotate, { toValue: -1, duration: 40, useNativeDriver: true }),
          Animated.timing(rotate, { toValue: 1, duration: 40, useNativeDriver: true }),
          Animated.timing(rotate, { toValue: 0, duration: 40, useNativeDriver: true }),
        ]),
      ]),
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          delay: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.8,
          duration: 200,
          delay: 100,
          useNativeDriver: true,
        }),
      ]),
    ]);

    animation.start(({ finished }) => {
      if (finished) {
        onComplete();
      }
    });

    return () => {
      animation.stop();
    };
  }, []);

  const rotateStr = rotate.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-15deg', '15deg'],
  });

  const containerStyle = (x !== undefined && y !== undefined)
    ? {
      position: 'absolute' as const,
      left: x,
      top: y,
      zIndex: 20,
      pointerEvents: 'none' as const,
    }
    : {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      zIndex: 20,
      pointerEvents: 'none' as const,
    };

  return (
    <View style={containerStyle}>
      <Animated.View
        style={{
          transform: [{ scale }, { rotate: rotateStr }],
          opacity,
        }}>
        <MaskedView
          style={{ width: 100, height: 100 }}
          maskElement={
            <View style={styles.maskContainer}>
              <Ionicons name="heart" size={100} color="black" />
            </View>
          }>
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ flex: 1 }}
          />
        </MaskedView>
      </Animated.View>
    </View>
  );
};


const FeedRow = ({ data, isVisible, height, onModalStateChange, onDeleteSuccess, onFullScreenChange }: FeedRowProps) => {
  const [isLiked, setIsLiked] = useState(data.likedByCurrentUser);
  const [totalLike, setTotalLike] = useState(data.totalLike);
  const [currentHeart, setCurrentHeart] = useState<HeartItem | null>(null);
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const handleToggleMute = () => setIsMuted(prev => !prev);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const modalTranslateY = useSharedValue(height);
  const fullScreenOpacity = useSharedValue(1);
  const exitButtonScale = useSharedValue(0);

  React.useEffect(() => {
    if (onModalStateChange) {
      onModalStateChange(showLikesModal || showCommentsModal);
    }
  }, [showLikesModal, showCommentsModal, onModalStateChange]);

  React.useEffect(() => {
    if (onFullScreenChange) {
      onFullScreenChange(isFullScreen);
    }

    fullScreenOpacity.value = withTiming(isFullScreen ? 0 : 1, { duration: 300 });
    exitButtonScale.value = withTiming(isFullScreen ? 1 : 0, {
      duration: 300,
      easing: Easing.out(Easing.cubic)
    });
  }, [isFullScreen, onFullScreenChange]);

  const uiAnimatedStyle = useAnimatedStyle(() => {
    const stopPoint = height * 0.8;
    const modalOpacity = interpolate(
      modalTranslateY.value,
      [stopPoint, height],
      [0, 1],
      Extrapolation.CLAMP,
    );

    return {
      opacity: modalOpacity * fullScreenOpacity.value,
    };
  });

  const exitButtonStyle = useAnimatedStyle(() => {
    return {
      opacity: exitButtonScale.value,
      transform: [{ scale: exitButtonScale.value }],
    };
  });

  const handleLike = async (coords?: { x: number; y: number }) => {
    const previousLikedState = isLiked;
    const previousTotalLike = totalLike;

    if (coords) {
      const x = coords.x - 50;
      const y = coords.y - 50;
      setCurrentHeart({ id: Date.now(), x, y });

      if (!previousLikedState) {
        setIsLiked(true);
        setTotalLike(prev => prev + 1);
        try {
          await postLikeService.toggleLikePost(data.id);
        } catch (error) {
          console.error('Failed to like post:', error);
          setIsLiked(false);
          setTotalLike(previousTotalLike);
        }
      }
    } else {
      const newLikedState = !isLiked;
      setIsLiked(newLikedState);
      setTotalLike(prev => newLikedState ? prev + 1 : prev - 1);

      if (newLikedState) {
        setCurrentHeart({ id: Date.now() });
      }

      try {
        await postLikeService.toggleLikePost(data.id);
      } catch (error) {
        console.error('Failed to toggle like:', error);
        setTotalLike(previousTotalLike);
      }
    }
  };

  const handleFollowChange = (isFollowing: boolean) => {
    const authorData = data.author as UserSummaryResponse;
    const username = authorData.profile?.firstName || authorData.username || 'Unknown';

    const message = isFollowing
      ? `Đang theo dõi ${username}`
      : `Đã bỏ theo dõi ${username}`;
    setToastMessage(message);
    setToastVisible(true);
  };

  const videoContainerStyle = useAnimatedStyle(() => {
    if (!modalTranslateY) return { flex: 1 };

    const stopPoint = height * 0.5;

    return {
      height: interpolate(
        modalTranslateY.value,
        [stopPoint, height],
        [stopPoint, height],
        Extrapolation.CLAMP,
      ),
    };
  });

  return (
    <View style={[styles.container, { height: height }]}>
      <Reanimated.View style={[styles.videoContainer, videoContainerStyle]}>
        <VideoComponent
          data={data}
          isVisible={isVisible}
          onDoubleTap={handleLike}
          modalTranslateY={modalTranslateY}
          screenHeight={height}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          isCommentsOpen={showCommentsModal}
        />

        {currentHeart && (
          <AnimatedHeart
            key={currentHeart.id}
            x={currentHeart.x}
            y={currentHeart.y}
            onComplete={() => setCurrentHeart(null)}
          />
        )}

        {isFullScreen && (
          <Reanimated.View style={[styles.exitFullScreenButton, exitButtonStyle]}>
            <AntDesign name="expand-alt" size={24} color="white" onPress={() => setIsFullScreen(false)} />
          </Reanimated.View>
        )}

        {!isFullScreen && (
          <Reanimated.View
            style={uiAnimatedStyle}
            pointerEvents={showLikesModal || showCommentsModal ? 'none' : 'box-none'}>
            <FeedSideBar
              data={{ ...data, totalLike }}
              isLiked={isLiked}
              onLike={() => handleLike()}
              onLikeCountPress={() => {
                setShowLikesModal(true);
                onModalStateChange?.(true);
              }}
              onCommentPress={() => {
                setShowCommentsModal(true);
                onModalStateChange?.(true);
              }}
              onDeleteSuccess={onDeleteSuccess}
              onFullScreen={() => setIsFullScreen(true)}
            />
            <FeedFooter
              data={data}
              onFollowChange={handleFollowChange}
            />
          </Reanimated.View>
        )}
      </Reanimated.View>

      <LikesModal
        visible={showLikesModal}
        onClose={() => {
          setShowLikesModal(false);
          onModalStateChange?.(false);
        }}
        postId={data.id}
        totalLikes={totalLike}
      />

      <CommentsModal
        visible={showCommentsModal}
        onClose={() => {
          setShowCommentsModal(false);
          onModalStateChange?.(false);
        }}
        postId={data.id}
        postAuthorId={data.author.id}
        modalTranslateY={modalTranslateY}
        isMuted={isMuted}
        onToggleMute={() => setIsMuted(prev => !prev)}
      />

      <Toast
        visible={toastVisible}
        message={toastMessage}
        onHide={() => setToastVisible(false)}
        position="center"
        duration={2000}
      />
    </View>
  );
};

export default FeedRow;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: 'black',
    overflow: 'hidden',
  },
  videoContainer: {
    width: '100%',
    position: 'relative',
  },
  heartContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
    pointerEvents: 'none',
  },
  maskContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exitFullScreenButton: {
    position: 'absolute',
    bottom: 40,
    right: 20,
    zIndex: 20,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 25,
  },
});
