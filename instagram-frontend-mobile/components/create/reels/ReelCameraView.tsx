import React, { useEffect, useRef, useState, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { CameraView, CameraType } from 'expo-camera';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

import { TopOverlay } from './TopOverlay';
import { BottomOverlay } from './BottomOverlay';
import type * as MediaLibrary from 'expo-media-library';

type GalleryAsset = {
  id: string;
  uri: string;
  mediaType: MediaLibrary.MediaTypeValue;
  duration?: number;
};

type CameraPageProps = {
  height: number;
  width: number;
  cameraRef: React.RefObject<CameraView | null>;
  cameraType: CameraType;
  torch: boolean;
  zoomLevel: number;
  recordState: 'idle' | 'recording';
  gallery: GalleryAsset[];
  isVisible: boolean;
  onToggleFlash: () => void;
  onAvatarPress: () => void;
  onRecordPress: () => void;
  onToggleCameraType: () => void;
  onGoToGallery: () => void;
  onClose: () => void;
  onCameraReady?: () => void;
  scrollSimultaneousRef?: React.RefObject<any>;
};

const MIN_ZOOM = 0;
const MAX_ZOOM = 1;
const ZOOM_SENSITIVITY = 0.25;

export function ReelCameraView(props: CameraPageProps) {
  const {
    height,
    width,
    cameraRef,
    cameraType,
    torch,
    zoomLevel,
    recordState,
    gallery,
    isVisible,
    onToggleFlash,
    onAvatarPress,
    onRecordPress,
    onToggleCameraType,
    onGoToGallery,
    onClose,
    onCameraReady,
    scrollSimultaneousRef,
  } = props;

  const [internalZoom, setInternalZoom] = useState(zoomLevel ?? 0);
  const baseZoomRef = useRef(internalZoom);

  // Đồng bộ props zoomLevel vào state nội bộ
  useEffect(() => {
    setInternalZoom(zoomLevel ?? 0);
    baseZoomRef.current = zoomLevel ?? 0;
  }, [zoomLevel]);

  const clampZoom = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));

  // Các hàm xử lý logic zoom (cần chạy trên JS thread)
  const handlePinchStart = () => {
    baseZoomRef.current = internalZoom;
  };

  const handlePinchUpdate = (scale: number) => {
    // Tính toán zoom mới dựa trên scale của gesture
    // Công thức: Zoom cũ + (tỉ lệ thay đổi * độ nhạy)
    const nextZoom = clampZoom(baseZoomRef.current + (scale - 1) * ZOOM_SENSITIVITY);
    setInternalZoom(nextZoom);
  };

  // Định nghĩa Gesture Pinch mới
  const pinchGesture = useMemo(() => {
    const gesture = Gesture.Pinch()
      .onStart(() => {
        'worklet';
        runOnJS(handlePinchStart)();
      })
      .onUpdate(e => {
        'worklet';
        runOnJS(handlePinchUpdate)(e.scale);
      });

    // Kết hợp với scroll view bên ngoài (nếu có) để tránh xung đột
    if (scrollSimultaneousRef) {
      gesture.simultaneousWithExternalGesture(scrollSimultaneousRef);
    }

    return gesture;
  }, [internalZoom, scrollSimultaneousRef]); // Dependencies để cập nhật gesture khi cần

  return (
    <View style={[styles.page, { height, width }]}>
      {/* GestureDetector bao bọc View chứa Camera */}
      <GestureDetector gesture={pinchGesture}>
        <View style={StyleSheet.absoluteFill}>
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing={cameraType}
            enableTorch={torch}
            zoom={internalZoom}
            mode="video"
            onCameraReady={onCameraReady}
          />
        </View>
      </GestureDetector>

      {isVisible && (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <TopOverlay torch={torch} onToggleFlash={onToggleFlash} onClose={onClose} />

          <BottomOverlay
            recordState={recordState}
            gallery={gallery}
            onRecordPress={onRecordPress}
            onToggleCameraType={onToggleCameraType}
            onGoToGallery={onGoToGallery}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#000',
  },
});
