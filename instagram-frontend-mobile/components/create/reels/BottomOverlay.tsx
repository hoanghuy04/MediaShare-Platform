import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import type * as MediaLibrary from 'expo-media-library';

type GalleryAsset = {
  id: string;
  uri: string;
  mediaType: MediaLibrary.MediaTypeValue;
  duration?: number;
};

type BottomOverlayProps = {
  recordState: 'idle' | 'recording';
  gallery: GalleryAsset[];
  onRecordPress: () => void;
  onToggleCameraType: () => void;
  onGoToGallery: () => void;
};

const MAX_DURATION_SEC = 15;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function BottomOverlay({
  recordState,
  gallery,
  onRecordPress,
  onToggleCameraType,
  onGoToGallery,
}: BottomOverlayProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (recordState === 'recording') {
      progress.setValue(0);
      Animated.timing(progress, {
        toValue: 1,
        duration: MAX_DURATION_SEC * 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start();
    } else {
      progress.stopAnimation(() => {
        progress.setValue(0);
      });
    }
  }, [recordState, progress]);

  const size = 120;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const strokeDashoffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  const lastThumb = gallery[0];

  return (
    <View style={styles.bottomRoot}>
      <TouchableOpacity style={styles.leftBtn} onPress={onGoToGallery}>
        {lastThumb ? (
          <Image source={{ uri: lastThumb.uri }} style={styles.thumb} />
        ) : (
          <View style={styles.thumbPlaceholder}>
            <Ionicons name="images-outline" size={22} color="#fff" />
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity activeOpacity={0.7} onPress={onRecordPress} style={styles.recordWrapper}>
        <Svg width={size} height={size}>
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#ff3bcf"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="transparent"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
          />
        </Svg>

        <View style={styles.recordInner}>
          {recordState === 'recording' ? (
            <View style={styles.stopSquare} />
          ) : (
            <View style={styles.startCircle} />
          )}
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.rightBtn} onPress={onToggleCameraType}>
        <Ionicons name="camera-reverse-outline" size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomRoot: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 30,
    marginBottom: 50,
  },

  leftBtn: {
    width: 52,
    height: 52,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  thumbPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  recordWrapper: {
    width: 150,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordInner: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startCircle: {
    width: 60,
    height: 60,
    borderRadius: 36,
    backgroundColor: '#ffffff',
  },
  stopSquare: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#ffffff',
  },

  rightBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
