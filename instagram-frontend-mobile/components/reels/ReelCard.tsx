import React from 'react';
import { View, Dimensions, StyleSheet } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Post } from '@/types';

const { width: windowWidth, height: windowHeight } = Dimensions.get('window');

type ReelCardProps = {
  item: Post;
  index: number;
  currentIndex: number;
};

const ReelCard = ({ item, index, currentIndex }: ReelCardProps) => {
  const videoUrl = item?.media?.[0]?.url;
  if (!videoUrl) return null;

  // Tạo player
  const player = useVideoPlayer(videoUrl, playerInstance => {
    playerInstance.loop = true;
    if (currentIndex === index) {
      playerInstance.play();
    } else {
      playerInstance.pause();
    }
  });

  // Đồng bộ play/pause
  if (player) {
    if (currentIndex === index && !player.playing) {
      player.play();
    }
    if (currentIndex !== index && player.playing) {
      player.pause();
    }
  }

  return (
    <View style={styles.container}>
      <VideoView
        player={player}
        style={styles.video}
        contentFit="cover"
        nativeControls={false}
        allowsFullscreen={false}
        allowsPictureInPicture={false}
      />
    </View>
  );
};

export default ReelCard;

const styles = StyleSheet.create({
  container: {
    width: windowWidth,
    height: windowHeight,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
});
