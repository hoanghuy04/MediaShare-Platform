import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  useWindowDimensions,
  View,
  Text,
  Animated,
  Easing,
  Pressable,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { MediaCategory } from '../../types/enum.type';
import { PostResponse } from '../../types/post.type';

const AnimatedSlider = Animated.createAnimatedComponent(Slider);

interface VideoComponentProps {
  data: PostResponse;
  isVisible: boolean;
  onDoubleTap?: (coords: { x: number; y: number }) => void;
}

const formatTime = (seconds: number) => {
  if (!seconds || Number.isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const VideoComponent = ({ data, isVisible, onDoubleTap }: VideoComponentProps) => {
  const [progress, setProgress] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekTime, setSeekTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false); // State mute của user
  const [showMuteIcon, setShowMuteIcon] = useState(false);
  const singleTapTimer = useRef<any>(null);

  const muteIconOpacity = useRef(new Animated.Value(0)).current;
  const animatedProgress = useRef(new Animated.Value(0)).current;

  const videoFile = data.media.find(m => m.category === MediaCategory.VIDEO);
  const videoUrl = videoFile ? videoFile.url : '';

  const thumbnailFile = data.media.find(m => m.category === MediaCategory.IMAGE);
  const thumbnailUrl = thumbnailFile ? thumbnailFile.url : videoUrl;

  if (!videoUrl) return null;

  const player = useVideoPlayer(videoUrl, p => {
    p.loop = true;
    p.timeUpdateEventInterval = 0.1;
    p.muted = !isVisible || isMuted;

    if (isVisible) {
      p.play();
    } else {
      p.pause();
    }
  });

  // handle visible / seeking / mute
  useEffect(() => {
    if (!player) return;

    if (isVisible && !isSeeking) {
      player.play();
      player.muted = isMuted;
    } else {
      player.pause();
      if (!isVisible) player.muted = true;
    }
  }, [isVisible, isSeeking, player, isMuted]);

  // update progress khi video chạy
  useEffect(() => {
    if (!player) return;

    const subscription = player.addListener('timeUpdate', () => {
      if (!isSeeking && player.duration > 0) {
        const ratio = player.currentTime / player.duration;

        setProgress(prev => {
          if (Math.abs(ratio - prev) < 0.005) return prev;
          return ratio;
        });

        Animated.timing(animatedProgress, {
          toValue: ratio,
          duration: 100,
          easing: Easing.linear,
          useNativeDriver: false,
        }).start();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [player, isSeeking, animatedProgress]);

  const onSlidingStart = () => {
    setIsSeeking(true);
    animatedProgress.stopAnimation();
    player.pause(); // Dừng video khi bắt đầu kéo
  };

  const onValueChange = (value: number) => {
    animatedProgress.setValue(value);
    setProgress(value);

    if (player.duration > 0) {
      const time = value * player.duration;
      setSeekTime(time);
      // Cập nhật frame video ngay khi kéo để không bị đơ
      player.currentTime = time;
    }
  };

  const onSlidingComplete = (value: number) => {
    if (player.duration > 0) {
      const newTime = value * player.duration;
      player.currentTime = newTime;
    }
    setIsSeeking(false);
  };

  const handlePress = (event: any) => {
    const { locationX, locationY } = event.nativeEvent;

    if (singleTapTimer.current) {
      clearTimeout(singleTapTimer.current);
      singleTapTimer.current = null;
      if (onDoubleTap) {
        onDoubleTap({ x: locationX, y: locationY });
      }
    } else {
      singleTapTimer.current = setTimeout(() => {
        toggleMute();
        singleTapTimer.current = null;
      }, 300);
    }
  };

  const toggleMute = () => {
    setIsMuted(prev => !prev);
    setShowMuteIcon(true);

    muteIconOpacity.setValue(1);

    Animated.timing(muteIconOpacity, {
      toValue: 0,
      duration: 1000,
      delay: 500,
      useNativeDriver: true,
    }).start(() => {
      setShowMuteIcon(false);
    });
  };

  const { width } = useWindowDimensions();
  const tooltipWidth = 100;
  const sliderWidth = width;

  let leftPos = progress * sliderWidth - tooltipWidth / 2;
  if (leftPos < 10) leftPos = 10;
  if (leftPos > width - tooltipWidth - 10) leftPos = width - tooltipWidth - 10;

  return (
    <>
      <Pressable onPress={handlePress} style={styles.container}>
        <VideoView
          player={player}
          style={[styles.videoBase, { height: '100%' }]}
          contentFit="cover"
          nativeControls={false}
        />

        {showMuteIcon && (
          <View style={styles.muteIconContainer}>
            <Animated.View style={{ opacity: muteIconOpacity, padding: 20, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 50 }}>
              <Ionicons
                name={isMuted ? "volume-mute" : "volume-high"}
                size={30}
                color="white"
              />
            </Animated.View>
          </View>
        )}

        <LinearGradient
          colors={['#00000000', '#00000040', '#00000080']}
          style={styles.controlsContainer}
          pointerEvents="none"
        />
      </Pressable>

      {isSeeking && (
        <View style={[styles.previewContainer, { left: leftPos }]}>
          <View style={styles.previewVideoWrapper}>
            <Image source={{ uri: thumbnailUrl }} style={styles.previewVideo} contentFit="cover" />
            <Text style={styles.previewTime}>{formatTime(seekTime)}</Text>
          </View>
        </View>
      )}

      <View style={styles.sliderContainer}>
        <AnimatedSlider
          style={{ width: '100%', height: 40 }}
          minimumValue={0}
          maximumValue={1}
          value={animatedProgress}
          minimumTrackTintColor="#FFFFFF"
          maximumTrackTintColor="rgba(255, 255, 255, 0.2)"
          thumbTintColor="transparent"
          onSlidingStart={onSlidingStart}
          onSlidingComplete={onSlidingComplete}
          onValueChange={onValueChange}
        />
      </View>
    </>
  );
};

export default VideoComponent;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  videoBase: {
    backgroundColor: 'black',
    width: '100%',
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
    zIndex: 1,
  },
  sliderContainer: {
    position: 'absolute',
    bottom: -19,
    left: -16,
    right: -16,
    zIndex: 2,
  },
  previewContainer: {
    position: 'absolute',
    bottom: 80,
    zIndex: 3,
    alignItems: 'center',
  },
  previewVideoWrapper: {
    width: 100,
    height: 150,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'white',
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewVideo: {
    width: '100%',
    height: '100%',
  },
  previewTime: {
    position: 'absolute',
    bottom: 10,
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  muteIconContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
});
