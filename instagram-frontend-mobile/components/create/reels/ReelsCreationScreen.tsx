import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  CameraView,
  useCameraPermissions,
  useMicrophonePermissions,
  CameraType,
  FlashMode,
} from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { useRouter } from 'expo-router';

import { GalleryPage } from './GalleryPage';

import { Dimensions } from 'react-native';
import { CameraPage } from '@/components/create/reels/CameraPage';

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

  const [camPermission, requestCamPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [hasMediaPermission, setHasMediaPermission] = useState<boolean | null>(null);

  const [cameraType, setCameraType] = useState<CameraType>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  const [zoomLevel] = useState<number>(0);

  const [recordState, setRecordState] = useState<'idle' | 'recording' | 'postrecord'>('idle');
  const [lastClipUri, setLastClipUri] = useState<string | null>(null);

  const [gallery, setGallery] = useState<GalleryAsset[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(true);

  const [lastOffsetY, setLastOffsetY] = useState(0);

  const [isOnCameraPage, setIsOnCameraPage] = useState(true);

  const [parentScrollEnabled, setParentScrollEnabled] = useState(true);

  useEffect(() => {
    (async () => {
      if (!camPermission?.granted) await requestCamPermission();
      if (!micPermission?.granted) await requestMicPermission();

      const mediaStatus = await MediaLibrary.requestPermissionsAsync();
      setHasMediaPermission(mediaStatus.status === 'granted');
    })();
  }, [camPermission, micPermission, requestCamPermission, requestMicPermission]);

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
          assets.assets.map(async (a) => {
            try {
              const assetInfo = await MediaLibrary.getAssetInfoAsync(a.id, {
                shouldDownloadFromNetwork: false,
              });
              return {
                id: a.id,
                uri: assetInfo.localUri || a.uri, 
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

        const videoCount = mapped.filter(a => a.mediaType === 'video').length;

        setGallery(mapped);
      } catch (err) {
        console.error('Error loading gallery:', err);
      } finally {
        setLoadingGallery(false);
      }
    })();
  }, [hasMediaPermission]);

  const handleRecordPress = useCallback(async () => {
    const cam = cameraRef.current;
    if (!cam) return;

    if (recordState === 'idle' || recordState === 'postrecord') {
      try {
        setRecordState('recording');

        const videoData = await cam.recordAsync({ maxDuration: 60 });

        if (videoData?.uri) {
          setLastClipUri(videoData.uri);
          try {
            await MediaLibrary.saveToLibraryAsync(videoData.uri);
          } catch (saveErr) {}
        }

        setRecordState('postrecord');
      } catch (err) {
        setRecordState('idle');
      }
    } else if (recordState === 'recording') {
      cam.stopRecording();
    }
  }, [recordState]);

  const handleUndo = useCallback(() => {
    setRecordState('idle');
    setLastClipUri(null);
  }, []);

  const openPreview = useCallback(
    (uri: string) => {
      const asset = gallery.find(a => a.uri === uri);
      const mediaType = asset?.mediaType === 'video' ? 'video' : 'photo';
      router.push({
        pathname: '/create/reels/preview',
        params: { mediaUri: uri, mediaType },
      });
    },
    [gallery, router]
  );

  const handleNext = useCallback(() => {
    if (lastClipUri) {
      openPreview(lastClipUri);
    }
  }, [lastClipUri, openPreview]);

  const toggleCameraType = useCallback(() => {
    setCameraType(prev => (prev === 'back' ? 'front' : 'back'));
  }, []);

  const toggleFlash = useCallback(() => {
    setFlash(prev => (prev === 'off' ? 'on' : 'off'));
  }, []);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setLastOffsetY(offsetY);

    setIsOnCameraPage(offsetY < FULL_HEIGHT / 2);
  };

  const handleScrollBeginDrag = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    dragStartYRef.current = event.nativeEvent.contentOffset.y;
    isProgrammaticRef.current = false;
  };

  const trySnapCameraPage = useCallback(() => {
    if (!parentScrollEnabled) return;
    if (isProgrammaticRef.current) {
      isProgrammaticRef.current = false;
      return;
    }
    if (!scrollViewRef.current) return;

    const startY = dragStartYRef.current;
    const endY = lastOffsetY;
    const delta = endY - startY;

    const MIN_SWIPE = 2;

    if (delta > MIN_SWIPE) {
      goToGallery();
    } else {
      goToCamera();
    }
  }, [lastOffsetY, parentScrollEnabled]);

  const goToGallery = useCallback(() => {
    if (!scrollViewRef.current) return;
    isProgrammaticRef.current = true;
    setParentScrollEnabled(false);
    scrollViewRef.current.scrollTo({
      y: FULL_HEIGHT,
      animated: true,
    });
    setLastOffsetY(FULL_HEIGHT);
  }, []);

  const goToCamera = useCallback(() => {
    if (!scrollViewRef.current) return;
    isProgrammaticRef.current = true;
    setParentScrollEnabled(true);
    scrollViewRef.current.scrollTo({
      y: 0,
      animated: true,
    });
    setLastOffsetY(0);
  }, []);

  const handleGalleryBeginDrag = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    galleryDragStartYRef.current = e.nativeEvent.contentOffset.y;
    galleryScrollYRef.current = e.nativeEvent.contentOffset.y;
  }, []);

  const handleGalleryScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollY = e.nativeEvent.contentOffset.y;
    galleryScrollYRef.current = scrollY;

    if (scrollY <= 0) {
      setParentScrollEnabled(true);
    } else {
      setParentScrollEnabled(false);
    }
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
        <Text style={styles.permText}>Bạn cần bật quyền Camera + Micro để quay Reels.</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar hidden style="light" />

      <ScrollView
        ref={scrollViewRef}
        style={styles.scroll}
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        showsVerticalScrollIndicator={false}
        bounces={false}
        pagingEnabled={false}
        scrollEnabled={parentScrollEnabled}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={trySnapCameraPage}
        onMomentumScrollEnd={trySnapCameraPage}
      >
        <CameraPage
          height={FULL_HEIGHT}
          width={FULL_WIDTH}
          cameraRef={cameraRef}
          cameraType={cameraType}
          flash={flash}
          zoomLevel={zoomLevel}
          recordState={recordState}
          lastClipUri={lastClipUri}
          gallery={gallery}
          isVisible={isOnCameraPage}
          onToggleFlash={toggleFlash}
          onAvatarPress={goToGallery}
          onRecordPress={handleRecordPress}
          onToggleCameraType={toggleCameraType}
          onUndo={handleUndo}
          onNext={handleNext}
          onGoToGallery={goToGallery}
        />

        <GalleryPage
          height={FULL_HEIGHT}
          gallery={gallery}
          loadingGallery={loadingGallery}
          onGoToCamera={goToCamera}
          onScrollBeginDrag={handleGalleryBeginDrag}
          onScroll={handleGalleryScroll}
          onScrollEndDrag={handleGalleryEndDrag}
          onOpenPreview={openPreview}
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
});
