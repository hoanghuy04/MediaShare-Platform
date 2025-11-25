import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Alert,
  Dimensions,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  CameraView,
  useCameraPermissions,
  useMicrophonePermissions,
  CameraType,
} from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { ReelCameraView } from '@components/create/reels/ReelCameraView';
import { ReelGaleryView } from '@components/create/reels/ReelGaleryView';

const { height: FULL_HEIGHT, width: FULL_WIDTH } = Dimensions.get('screen');

type GalleryAsset = {
  id: string;
  uri: string;
  mediaType: MediaLibrary.MediaTypeValue;
  duration?: number;
};

export default function ReelsCreationScreen() {
  const router = useRouter();

  const scrollViewRef = useRef<ScrollView | null>(null);
  const cameraRef = useRef<CameraView | null>(null);

  const dragStartYRef = useRef<number>(0);
  const galleryDragStartYRef = useRef<number>(0);
  const galleryScrollYRef = useRef<number>(0);
  const isProgrammaticRef = useRef<boolean>(false);
  const hasRequestedPermissions = useRef<boolean>(false);

  const [camPermission, requestCamPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [hasMediaPermission, setHasMediaPermission] = useState<boolean | null>(null);

  const [cameraType, setCameraType] = useState<CameraType>('back');
  const [torch, setTorch] = useState<boolean>(false);

  const [zoomLevel] = useState<number>(0);

  const [recordState, setRecordState] = useState<'idle' | 'recording'>('idle');

  const [gallery, setGallery] = useState<GalleryAsset[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(true);

  const [lastOffsetY, setLastOffsetY] = useState(0);
  const [isOnCameraPage, setIsOnCameraPage] = useState(true);

  useEffect(() => {
    if (hasRequestedPermissions.current) return;
    hasRequestedPermissions.current = true;

    (async () => {
      if (!camPermission?.granted) await requestCamPermission();
      if (!micPermission?.granted) await requestMicPermission();

      const mediaStatus = await MediaLibrary.requestPermissionsAsync();
      setHasMediaPermission(mediaStatus.status === 'granted');
    })();
  }, []);

  useEffect(() => {
    if (!hasMediaPermission) return;

    (async () => {
      try {
        const assets = await MediaLibrary.getAssetsAsync({
          mediaType: ['photo', 'video'],
          sortBy: [['creationTime', false]],
          first: 80,
        });

        const mapped: GalleryAsset[] = await Promise.all(
          assets.assets.map(async a => {
            try {
              const assetInfo = await MediaLibrary.getAssetInfoAsync(a.id, {
                shouldDownloadFromNetwork: false,
              });
              const finalUri = assetInfo.localUri || a.uri;

              if (finalUri.startsWith('ph://')) {
                try {
                  const retryInfo = await MediaLibrary.getAssetInfoAsync(a.id, {
                    shouldDownloadFromNetwork: true,
                  });
                  if (retryInfo.localUri) {
                    return {
                      id: a.id,
                      uri: retryInfo.localUri,
                      mediaType: a.mediaType,
                      duration: a.duration,
                    };
                  }
                } catch (retryErr) {
                  console.warn('Failed to get localUri for asset:', a.id);
                }
              }

              return {
                id: a.id,
                uri: finalUri,
                mediaType: a.mediaType,
                duration: a.duration,
              };
            } catch (err) {
              return {
                id: a.id,
                uri: a.uri,
                mediaType: a.mediaType,
                duration: a.duration,
              };
            }
          })
        );

        setGallery(mapped);
      } catch (err) {
        console.error('Load gallery error:', err);
      } finally {
        setLoadingGallery(false);
      }
    })();
  }, [hasMediaPermission]);

  const handleRequestPermissions = useCallback(async () => {
    // Check if we can ask again
    const canAskCam = camPermission?.canAskAgain ?? true;
    const canAskMic = micPermission?.canAskAgain ?? true;

    if (!canAskCam || !canAskMic) {
      // Permissions are permanently denied, need to open settings
      Alert.alert(
        'Cần cấp quyền',
        'Bạn đã từ chối quyền truy cập. Vui lòng vào Cài đặt để bật quyền Camera và Microphone.',
        [
          {
            text: 'Hủy',
            style: 'cancel',
          },
          {
            text: 'Mở Cài đặt',
            onPress: () => Linking.openSettings(),
          },
        ]
      );
    } else {
      // Can still request permissions
      hasRequestedPermissions.current = false; // Reset flag to allow retry
      await requestCamPermission();
      await requestMicPermission();
    }
  }, [camPermission, micPermission, requestCamPermission, requestMicPermission]);

  const handleRecordPress = useCallback(async () => {
    const cam = cameraRef.current;
    if (!cam) return;

    if (recordState === 'idle') {
      try {
        setRecordState('recording');

        const video = await cam.recordAsync({
          maxDuration: 60,
        });

        if (video?.uri) {
          setRecordState('idle');
          setTorch(false);
          router.push({
            pathname: '/create/reels/preview',
            params: { videoUri: video.uri, mediaType: 'video', source: 'recorded' },
          });
        } else {
          setRecordState('idle');
        }
      } catch (err: any) {
        const msg = String(err?.message || err);
        if (!msg.includes('Recording was stopped before any data could be produced')) {
          Alert.alert('Lỗi', 'Không quay được video. Vui lòng thử lại.');
        }
        setRecordState('idle');
      }
    } else if (recordState === 'recording') {
      try {
        cam.stopRecording();
      } catch (err) {
        setRecordState('idle');
      }
    }
  }, [recordState, router]);

  const openPreview = useCallback(
    (uri: string, forcedType?: 'photo' | 'video') => {
      const asset = gallery.find(a => a.uri === uri);
      const mediaType: 'photo' | 'video' =
        forcedType ?? (asset?.mediaType === 'video' ? 'video' : 'photo');

      router.push({
        pathname: '/create/reels/preview',
        params: {
          videoUri: uri,
          mediaType,
          source: 'gallery',
        },
      });
    },
    [gallery, router]
  );

  const toggleCameraType = useCallback(() => {
    setCameraType(prev => (prev === 'back' ? 'front' : 'back'));
  }, []);

  const toggleTorch = useCallback(() => {
    setTorch(prev => !prev);
  }, []);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    // Don't update state while recording to prevent lag
    if (recordState === 'recording') return;

    const offsetY = event.nativeEvent.contentOffset.y;
    const newIsOnCameraPage = offsetY < FULL_HEIGHT / 2;

    // Only update if values actually changed
    if (offsetY !== lastOffsetY) {
      setLastOffsetY(offsetY);
    }
    if (newIsOnCameraPage !== isOnCameraPage) {
      setIsOnCameraPage(newIsOnCameraPage);
    }
  };

  const handleScrollBeginDrag = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    dragStartYRef.current = event.nativeEvent.contentOffset.y;
    isProgrammaticRef.current = false;
  };

  const goToGallery = useCallback(() => {
    if (!scrollViewRef.current) return;
    isProgrammaticRef.current = true;
    scrollViewRef.current.scrollTo({ y: FULL_HEIGHT, animated: true });
    setLastOffsetY(FULL_HEIGHT);
  }, []);

  const goToCamera = useCallback(() => {
    if (!scrollViewRef.current) return;
    isProgrammaticRef.current = true;
    scrollViewRef.current.scrollTo({ y: 0, animated: true });
    setLastOffsetY(0);
  }, []);

  const trySnapCameraPage = useCallback(() => {
    if (isProgrammaticRef.current) {
      isProgrammaticRef.current = false;
      return;
    }
    const startY = dragStartYRef.current;
    const endY = lastOffsetY;
    const delta = endY - startY;
    const MIN_SWIPE = 2;

    if (delta > MIN_SWIPE) {
      goToGallery();
    } else {
      goToCamera();
    }
  }, [lastOffsetY, goToCamera, goToGallery]);

  const handleGalleryBeginDrag = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    galleryDragStartYRef.current = e.nativeEvent.contentOffset.y;
    galleryScrollYRef.current = e.nativeEvent.contentOffset.y;
  }, []);

  const handleGalleryScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollY = e.nativeEvent.contentOffset.y;
    galleryScrollYRef.current = scrollY;
  }, []);

  const handleGalleryEndDrag = useCallback(() => {
    const start = galleryDragStartYRef.current;
    const end = galleryScrollYRef.current;
    const delta = end - start;

    const PULL_UP_THRESHOLD = -30;
    const isAtTop = end <= 10;

    if (isAtTop && delta < PULL_UP_THRESHOLD) {
      goToCamera();
    }
  }, [goToCamera]);

  const handleOpenAlbumPicker = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: false,
        allowsMultipleSelection: false,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const mediaType = asset.type === 'video' ? 'video' : 'photo';
        openPreview(asset.uri, mediaType);
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể mở thư viện ảnh');
    }
  }, [openPreview]);

  const handleClose = useCallback(() => {
    router.push('/(tabs)/feed');
  }, [router]);

  if (!camPermission || !micPermission) {
    return (
      <View style={styles.centerScreen}>
        <StatusBar hidden style="light" />
        <Text style={styles.permText}>Đang xin quyền truy cập...</Text>
      </View>
    );
  }

  if (!camPermission.granted || !micPermission.granted) {
    return (
      <View style={styles.centerScreen}>
        <StatusBar hidden style="light" />
        <Text style={styles.permTitle}>Bạn cần bật quyền Camera + Micro để quay Reels.</Text>
        <TouchableOpacity style={styles.permButton} onPress={handleRequestPermissions}>
          <Text style={styles.permButtonText}>Cấp quyền</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.scroll}
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        showsVerticalScrollIndicator={false}
        bounces={false}
        pagingEnabled={false}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={trySnapCameraPage}
        onMomentumScrollEnd={trySnapCameraPage}
      >
        <ReelCameraView
          height={FULL_HEIGHT}
          width={FULL_WIDTH}
          cameraRef={cameraRef}
          cameraType={cameraType}
          torch={torch}
          zoomLevel={zoomLevel}
          recordState={recordState}
          gallery={gallery}
          isVisible={isOnCameraPage}
          onToggleFlash={toggleTorch}
          onAvatarPress={goToGallery}
          onRecordPress={handleRecordPress}
          onToggleCameraType={toggleCameraType}
          onGoToGallery={goToGallery}
          onClose={handleClose}
        />

        <ReelGaleryView
          height={FULL_HEIGHT}
          gallery={gallery}
          loadingGallery={loadingGallery}
          onGoToCamera={goToCamera}
          onScrollBeginDrag={handleGalleryBeginDrag}
          onScroll={handleGalleryScroll}
          onScrollEndDrag={handleGalleryEndDrag}
          onOpenPreview={openPreview}
          onOpenAlbumPicker={handleOpenAlbumPicker}
          onClose={handleClose}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  scroll: {
    flex: 1,
    backgroundColor: '#000',
  },
  centerScreen: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  permText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 22,
  },
  permTitle: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 20,
  },
  permButton: {
    backgroundColor: '#0095F6',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  permButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});