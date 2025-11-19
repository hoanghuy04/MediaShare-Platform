import React from 'react';
import { View, StyleSheet } from 'react-native';
import { CameraView, CameraType, FlashMode } from 'expo-camera';

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
  flash: FlashMode;
  zoomLevel: number;
  recordState: 'idle' | 'recording' | 'postrecord';
  lastClipUri: string | null;
  gallery: GalleryAsset[];
  isVisible: boolean;
  onToggleFlash: () => void;
  onAvatarPress: () => void;
  onRecordPress: () => void;
  onToggleCameraType: () => void;
  onUndo: () => void;
  onNext: () => void;
  onGoToGallery: () => void;
  onClose: () => void;
  onCameraReady: () => void;
};

export function CameraPage(props: CameraPageProps) {
  const {
    height,
    width,
    cameraRef,
    cameraType,
    flash,
    zoomLevel,
    recordState,
    lastClipUri,
    gallery,
    isVisible,
    onToggleFlash,
    onAvatarPress,
    onRecordPress,
    onToggleCameraType,
    onUndo,
    onNext,
    onGoToGallery,
    onClose,
    onCameraReady,
  } = props;

  return (
    <View style={[styles.page, { height, width }]}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={cameraType}
        flash={flash}
        zoom={zoomLevel}
        // NEW: quay video
        mode="video"
        onCameraReady={onCameraReady}
      />

      {isVisible && (
        <>
          <TopOverlay
            recordState={recordState}
            flash={flash}
            lastClipUri={lastClipUri}
            onToggleFlash={onToggleFlash}
            onAvatarPress={onAvatarPress}
            onClose={onClose}
          />

          <BottomOverlay
            recordState={recordState}
            gallery={gallery}
            lastClipUri={lastClipUri}
            onRecordPress={onRecordPress}
            onToggleCameraType={onToggleCameraType}
            onUndo={onUndo}
            onNext={onNext}
            onGoToGallery={onGoToGallery}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#000',
  },
});
