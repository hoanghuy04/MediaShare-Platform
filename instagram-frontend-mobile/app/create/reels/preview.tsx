import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useVideoPlayer, VideoView } from 'expo-video';
import * as MediaLibrary from 'expo-media-library';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function PreviewScreen() {
  const router = useRouter();
  const isFocused = useIsFocused();

  const params = useLocalSearchParams();

  const rawUri = params.videoUri as string;
  const uri = decodeURIComponent(rawUri);

  const mediaType = (params.mediaType as 'photo' | 'video') || 'video';
  const source = (params.source as 'recorded' | 'gallery') || 'recorded';

  const isRecorded = source === 'recorded';
  const [hasMediaPermission, setHasMediaPermission] = useState<boolean | null>(null);

  const player = useVideoPlayer(uri, player => {
    if (uri) {
      player.loop = true;
      player.play();
      player.muted = false;
    }
  });

  useEffect(() => {
    (async () => {
      const status = await MediaLibrary.requestPermissionsAsync();
      setHasMediaPermission(status.status === 'granted');
    })();
  }, []);

  const handleSaveToLibrary = useCallback(async () => {
    try {
      if (!hasMediaPermission) {
        const status = await MediaLibrary.requestPermissionsAsync();
        if (status.status !== 'granted') {
          alert('Bạn cần bật quyền lưu vào thư viện để tải video.');
          return;
        }
      }

      if (uri) {
        await MediaLibrary.saveToLibraryAsync(uri);
        alert('Đã lưu video vào thư viện.');
      }
    } catch (err) {
      console.error('Save video error:', err);
      alert('Không lưu được video, vui lòng thử lại.');
    }
  }, [hasMediaPermission, uri]);

  const handleClose = () => {
    router.back();
  };

  const handleNext = () => {
    player.pause();

    router.push({
      pathname: '/create/reels/post',
      params: {
        mediaUri: uri,
        mediaType: mediaType,
      },
    });
  };

  if (!uri) {
    return <View style={[styles.overlayRoot, { backgroundColor: '#000' }]} />;
  }

  return (
    <View style={styles.overlayRoot}>
      <StatusBar hidden />

      <View style={styles.topBar}>
        <TouchableOpacity style={styles.topBubble} onPress={handleClose}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.mediaArea}>
        {mediaType === 'video' ? (
          isFocused && (
            <VideoView
              style={styles.mediaImage}
              player={player}
              contentFit="contain"
              nativeControls={false}
            />
          )
        ) : (
          <Image source={{ uri: uri }} style={styles.mediaImage} resizeMode="contain" />
        )}
      </View>

      <View style={styles.bottomSheet}>
        <View style={styles.bottomRow}>
          {mediaType === 'video' && isRecorded && (
            <TouchableOpacity style={styles.downloadBtn} onPress={handleSaveToLibrary}>
              <Ionicons name="download-outline" size={18} color="#fff" />
              <Text style={styles.downloadText}>Tải xuống</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
            <Text style={styles.nextBtnText}>Tiếp</Text>
            <Ionicons name="chevron-forward" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlayRoot: {
    flex: 1,
    backgroundColor: '#000',
  },

  topBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 16 : 10,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
    justifyContent: 'space-between',
  },
  topBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  mediaArea: {
    flex: 1,
    width: SCREEN_WIDTH,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },

  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    paddingTop: 12,
  },

  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Platform.OS === 'ios' ? 20 : 12,
    alignItems: 'center',
  },

  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  downloadText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },

  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4a3bff',
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginLeft: 'auto',
  },
  nextBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 4,
  },
});
