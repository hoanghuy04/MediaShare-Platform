import { StyleSheet, View, Animated, Easing } from 'react-native';
import React, { useRef, useState } from 'react';
import VideoComponent from './VideoComponent';
import FeedFooter from './FeedFooter';
import FeedSideBar from './FeedSideBar';
import PostLikesModal from './PostLikesModal';
import { PostResponse } from '../../types/post.type';
import { Ionicons } from '@expo/vector-icons';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { postLikeService } from '../../services/post-like.service';

interface FeedRowProps {
  data: PostResponse;
  index: number;
  isVisible: boolean;
  isNext: boolean;
  height: number;
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


const FeedRow = ({ data, index, isVisible, isNext, height }: FeedRowProps) => {
  const [isLiked, setIsLiked] = useState(data.likedByCurrentUser);
  const [totalLike, setTotalLike] = useState(data.totalLike);
  const [currentHeart, setCurrentHeart] = useState<HeartItem | null>(null);
  const [showLikesModal, setShowLikesModal] = useState(false);

  const videoScaleAnim = useRef(new Animated.Value(1)).current;
  const videoTranslateY = useRef(new Animated.Value(0)).current;

  const handleModalVisibilityChange = (visible: boolean) => {
    Animated.parallel([
      Animated.timing(videoScaleAnim, {
        toValue: visible ? 0.5 : 1,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(videoTranslateY, {
        toValue: visible ? -height * 0.25 : 0,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  };

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
        setIsLiked(previousLikedState);
        setTotalLike(previousTotalLike);
      }
    }
  };

  return (
    <View style={[styles.container, { height: height }]}>
      <Animated.View
        style={{
          flex: 1,
          transform: [
            { scale: videoScaleAnim },
            { translateY: videoTranslateY },
          ],
        }}>
        <VideoComponent data={data} isVisible={isVisible} onDoubleTap={handleLike} />

        {currentHeart && (
          <AnimatedHeart
            key={currentHeart.id}
            x={currentHeart.x}
            y={currentHeart.y}
            onComplete={() => setCurrentHeart(null)}
          />
        )}

        <FeedSideBar
          data={{ ...data, totalLike }}
          isLiked={isLiked}
          onLike={() => handleLike()}
          onLikeCountPress={() => setShowLikesModal(true)}
        />
        <FeedFooter data={data} />
      </Animated.View>

      <PostLikesModal
        visible={showLikesModal}
        onClose={() => setShowLikesModal(false)}
        postId={data.id}
        totalLikes={totalLike}
        onVisibilityChange={handleModalVisibilityChange}
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
});
