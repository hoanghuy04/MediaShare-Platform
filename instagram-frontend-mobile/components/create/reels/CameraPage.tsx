import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { CameraView, CameraType, FlashMode } from 'expo-camera';
import {
  PinchGestureHandler,
  PinchGestureHandlerGestureEvent,
  State,
} from 'react-native-gesture-handler';

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

export function CameraPage(props: CameraPageProps) {
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

  useEffect(() => {
    setInternalZoom(zoomLevel ?? 0);
    baseZoomRef.current = zoomLevel ?? 0;
  }, [zoomLevel]);

  const clampZoom = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));

  const onPinchGesture = (event: PinchGestureHandlerGestureEvent) => {
    const { scale } = event.nativeEvent;
    const nextZoom = clampZoom(baseZoomRef.current + (scale - 1) * ZOOM_SENSITIVITY);
    setInternalZoom(nextZoom);
  };

  const onPinchStateChange = (event: PinchGestureHandlerGestureEvent) => {
    const { state, oldState } = event.nativeEvent as any;

    if (state === State.BEGAN) {
      baseZoomRef.current = internalZoom;
    }

    if (oldState === State.ACTIVE && (state === State.END || state === State.CANCELLED)) {
      baseZoomRef.current = internalZoom;
    }
  };

  return (
    <View style={[styles.page, { height, width }]}>
      <PinchGestureHandler
        enabled={isVisible}
        onGestureEvent={onPinchGesture}
        onHandlerStateChange={onPinchStateChange}
        simultaneousHandlers={scrollSimultaneousRef}
      >
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
      </PinchGestureHandler>

      {isVisible && (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <TopOverlay
            recordState={recordState}
            torch={torch}
            onToggleFlash={onToggleFlash}
            onAvatarPress={onAvatarPress}
            onClose={onClose}
          />

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
