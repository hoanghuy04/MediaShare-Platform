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
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { MediaCategory } from '../../types/enum.type';
import { PostResponse } from '../../types/post.type';
import Reanimated from 'react-native-reanimated';

const AnimatedSlider = Animated.createAnimatedComponent(Slider);

interface VideoComponentProps {
  data: PostResponse;
  isVisible: boolean;
  onDoubleTap?: (coords: { x: number; y: number }) => void;
  modalTranslateY?: any;
  screenHeight?: number;
  isMuted: boolean;
  onToggleMute?: () => void;
  isCommentsOpen?: boolean;
}

const formatTime = (seconds: number) => {
  if (!seconds || Number.isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const VideoComponent = ({
  data,
  isVisible,
  onDoubleTap,
  isMuted,
  onToggleMute,
}: VideoComponentProps) => {
  console.log(data);
  const [progress, setProgress] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekTime, setSeekTime] = useState(0);
  const [showMuteIcon, setShowMuteIcon] = useState(false);
  const [duration, setDuration] = useState(0);

  const videoRef = useRef<Video>(null);
  const singleTapTimer = useRef<any>(null);
  const currentProgressRef = useRef(0);

  const muteIconOpacity = useRef(new Animated.Value(0)).current;
  const animatedProgress = useRef(new Animated.Value(0)).current;
  const { width: screenWidth } = useWindowDimensions();

  const videoFile = data.media.find(m => m.category === MediaCategory.VIDEO);
  const imageFile = data.media.find(m => m.category === MediaCategory.IMAGE);

  const activeMedia = videoFile || imageFile;
  const isVideo = activeMedia?.category === MediaCategory.VIDEO;
  const mediaUrl = activeMedia?.url || '';

  const thumbnailFile = data.media.find(m => m.category === MediaCategory.IMAGE);
  const thumbnailUrl = thumbnailFile ? thumbnailFile.url : mediaUrl;

  // Handle visibility changes
  useEffect(() => {
    if (!videoRef.current || !isVideo) return;

    const handlePlayback = async () => {
      try {
        if (isVisible && !isSeeking) {
          await videoRef.current?.playAsync();
          await videoRef.current?.setIsMutedAsync(isMuted);
        } else {
          await videoRef.current?.pauseAsync();
        }
      } catch (error) {
        console.error('Error controlling video playback:', error);
      }
    };

    handlePlayback();
  }, [isVisible, isSeeking, isMuted, isVideo]);

  // Handle video status updates
  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;

    if (status.durationMillis) {
      setDuration(status.durationMillis / 1000);
    }

    if (!isSeeking && status.durationMillis && status.positionMillis) {
      const ratio = status.positionMillis / status.durationMillis;
      currentProgressRef.current = ratio;

      Animated.timing(animatedProgress, {
        toValue: ratio,
        duration: 100,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start();
    }
  };

  const onSlidingStart = () => {
    if (!isVideo) return;
    setIsSeeking(true);
    setProgress(currentProgressRef.current);
    animatedProgress.stopAnimation();
  };

  const onValueChange = (value: number) => {
    if (!isVideo) return;
    animatedProgress.setValue(value);
    setProgress(value);

    if (duration > 0) {
      const time = value * duration;
      setSeekTime(time);
    }
  };

  const onSlidingComplete = async (value: number) => {
    if (!isVideo || !videoRef.current) return;

    try {
      if (duration > 0) {
        const newTime = value * duration * 1000;
        await videoRef.current.setPositionAsync(newTime);
      }

      setIsSeeking(false);

      if (isVisible) {
        await videoRef.current.playAsync();
      }
    } catch (error) {
      console.error('Error seeking video:', error);
      setIsSeeking(false);
    }
  };

  const toggleMute = () => {
    if (!isVideo) return;
    onToggleMute?.();
    setShowMuteIcon(true);

    muteIconOpacity.setValue(1);

    Animated.timing(muteIconOpacity, {
      toValue: 0,
      duration: 1000,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setShowMuteIcon(false);
    });
  };

  const handlePress = (event: any) => {
    const { locationX, locationY } = event.nativeEvent;

    if (singleTapTimer.current) {
      clearTimeout(singleTapTimer.current);
      singleTapTimer.current = null;
      onDoubleTap?.({ x: locationX, y: locationY });
    } else {
      singleTapTimer.current = setTimeout(() => {
        if (isVideo) {
          toggleMute();
        }
        singleTapTimer.current = null;
      }, 300);
    }
  };

  if (!mediaUrl) return null;

  const tooltipWidth = 100;
  const sliderWidth = screenWidth;

  let leftPos = progress * sliderWidth - tooltipWidth / 2;
  if (leftPos < 10) leftPos = 10;
  if (leftPos > screenWidth - tooltipWidth - 10) {
    leftPos = screenWidth - tooltipWidth - 10;
  }

  return (
    <>
      <Reanimated.View style={styles.container}>
        <Pressable onPress={handlePress} style={StyleSheet.absoluteFill}>
          <View style={styles.videoCard}>
            {isVideo ? (
              <Video
                ref={videoRef}
                source={{ uri: mediaUrl }}
                style={styles.video}
                resizeMode={ResizeMode.CONTAIN}
                isLooping
                shouldPlay={isVisible && !isSeeking}
                isMuted={isMuted}
                onPlaybackStatusUpdate={onPlaybackStatusUpdate}
                progressUpdateIntervalMillis={100}
                useNativeControls={false}
              />
            ) : (
              <Image
                source={{ uri: mediaUrl }}
                style={styles.video}
                contentFit="contain"
              />
            )}

            {isVideo && showMuteIcon && (
              <View style={styles.muteIconContainer}>
                <Animated.View
                  style={{
                    opacity: muteIconOpacity,
                    padding: 20,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    borderRadius: 50,
                  }}>
                  <Ionicons
                    name={isMuted ? 'volume-mute' : 'volume-high'}
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
          </View>
        </Pressable>
      </Reanimated.View>

      {isVideo && isSeeking && (
        <View style={[styles.previewContainer, { left: leftPos }]}>
          <View style={styles.previewVideoWrapper}>
            <Image
              source={{ uri: thumbnailUrl }}
              style={styles.previewVideo}
              contentFit="cover"
            />
            <Text style={styles.previewTime}>{formatTime(seekTime)}</Text>
          </View>
        </View>
      )}

      {isVideo && (
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
      )}
    </>
  );
};

export default VideoComponent;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: 'black',
  },
  videoCard: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: 'black',
  },
  video: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: 'black',
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
