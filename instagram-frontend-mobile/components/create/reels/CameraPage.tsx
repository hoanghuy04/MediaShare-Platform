import React from 'react';
import { View, StyleSheet } from 'react-native';
import { CameraView, CameraType, FlashMode } from 'expo-camera';

import { TopOverlay } from './TopOverlay';
import { BottomOverlay } from './BottomOverlay';
import { LeftToolbar } from './LeftToolbar';

import type * as MediaLibrary from 'expo-media-library';

type GalleryAsset = {
  id: string;
  uri: string;
  mediaType: MediaLibrary.MediaTypeValue;
  duration?: number;
};

type CameraPageProps = {
  height: number; // dùng FULL_HEIGHT
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
};

export function CameraPage({
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
}: CameraPageProps) {
  return (
    <View style={[styles.page, { height, width }]}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={cameraType}
        flash={flash}
        zoom={zoomLevel}
      />

      {isVisible && (
        <>
          <TopOverlay
            recordState={recordState}
            flash={flash}
            lastClipUri={lastClipUri}
            onToggleFlash={onToggleFlash}
            onAvatarPress={onAvatarPress}
          />

          <LeftToolbar visible={recordState !== 'recording'} />

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
