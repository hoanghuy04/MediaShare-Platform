import { StyleSheet, useWindowDimensions, View, Text } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Slider from '@react-native-community/slider';
import { MediaCategory } from '../../types/enum.type';
import { PostResponse } from '../../types/post.type';

interface VideoComponentProps {
  data: PostResponse;
  isVisible: boolean;
}

const formatTime = (seconds: number) => {
  if (!seconds || Number.isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const VideoComponent = ({ data, isVisible }: VideoComponentProps) => {
  const [progress, setProgress] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekTime, setSeekTime] = useState(0);

  const videoFile = data.media.find(m => m.category === MediaCategory.VIDEO);
  const videoUrl = videoFile ? videoFile.url : '';

  const thumbnailFile = data.media.find(m => m.category === MediaCategory.IMAGE);
  const thumbnailUrl = thumbnailFile ? thumbnailFile.url : videoUrl;

  if (!videoUrl) return null;

  const player = useVideoPlayer(videoUrl, p => {
    p.loop = true;
    p.timeUpdateEventInterval = 0.5;
    p.muted = !isVisible;

    if (isVisible) {
      p.play();
    } else {
      p.pause();
    }
  });

  useEffect(() => {
    if (!player) return;

    if (isVisible && !isSeeking) {
      player.play();
      player.muted = false;
    } else {
      player.pause();
      if (!isVisible) {
        player.muted = true;
      }
    }
  }, [isVisible, isSeeking, player]);

  useEffect(() => {
    if (!player) return;

    const subscription = player.addListener('timeUpdate', () => {
      if (!isSeeking && player.duration > 0) {
        const ratio = player.currentTime / player.duration;
        setProgress(ratio);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [player, isSeeking]);

  const onSlidingStart = () => {
    setIsSeeking(true);
  };

  const onValueChange = (value: number) => {
    setProgress(value);
    if (player.duration > 0) {
      const time = value * player.duration;
      setSeekTime(time);
    }
  };

  const onSlidingComplete = (value: number) => {
    if (player.duration > 0) {
      const newTime = value * player.duration;
      player.currentTime = newTime;
    }
    setIsSeeking(false);
  };

  const { width } = useWindowDimensions();
  const tooltipWidth = 100;
  const sliderWidth = width;

  let leftPos = progress * sliderWidth - tooltipWidth / 2;
  if (leftPos < 10) leftPos = 10;
  if (leftPos > width - tooltipWidth - 10) leftPos = width - tooltipWidth - 10;

  return (
    <>
      <VideoView
        player={player}
        style={[styles.videoBase, { height: '100%' }]}
        contentFit="cover"
        nativeControls={false}
      />

      <LinearGradient
        colors={['#00000000', '#00000040', '#00000080']}
        style={styles.controlsContainer}
        pointerEvents="none"
      />

      {isSeeking && (
        <View style={[styles.previewContainer, { left: leftPos }]}>
          <View style={styles.previewVideoWrapper}>
            <Image source={{ uri: thumbnailUrl }} style={styles.previewVideo} contentFit="cover" />
            <Text style={styles.previewTime}>{formatTime(seekTime)}</Text>
          </View>
        </View>
      )}

      <View style={styles.sliderContainer}>
        <Slider
          style={{ width: '100%', height: 40 }}
          minimumValue={0}
          maximumValue={1}
          value={progress}
          minimumTrackTintColor="#FFFFFF"
          maximumTrackTintColor="rgba(255, 255, 255, 0.3)"
          thumbTintColor="#FFFFFF"
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
    bottom: -10,
    left: 0,
    right: 0,
    zIndex: 2,
    paddingHorizontal: 0,
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
});
