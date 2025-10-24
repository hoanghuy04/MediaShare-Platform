import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type GalleryAsset = {
  id: string;
  uri: string;
  mediaType: any;
  duration?: number;
};

type BottomOverlayProps = {
  recordState: 'idle' | 'recording' | 'postrecord';
  gallery: GalleryAsset[];
  lastClipUri: string | null;
  onRecordPress: () => void;
  onToggleCameraType: () => void;
  onUndo: () => void;
  onNext: () => void;
  onGoToGallery: () => void;
};

export function BottomOverlay({
  recordState,
  gallery,
  lastClipUri,
  onRecordPress,
  onToggleCameraType,
  onUndo,
  onNext,
  onGoToGallery,
}: BottomOverlayProps) {
  if (recordState === 'idle') {
    return (
      <View style={styles.bottomSectionIdle}>
        <TouchableOpacity style={styles.galleryPreviewBtn} onPress={onGoToGallery}>
          {gallery[0] ? (
            <Image source={{ uri: gallery[0].uri }} style={styles.galleryPreviewThumb} />
          ) : (
            <View style={styles.galleryPreviewThumbEmpty}>
              <Ionicons name="images-outline" size={20} color="#fff" />
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onRecordPress}
          activeOpacity={0.7}
          style={styles.idleRecordOuter}
        >
          <View style={styles.idleRecordInner} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.flipBtnBubble} onPress={onToggleCameraType}>
          <Ionicons name="camera-reverse-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  }

  if (recordState === 'recording') {
    return (
      <View style={styles.bottomSectionRecording}>
        <TouchableOpacity onPress={onRecordPress} activeOpacity={0.8}>
          <View style={styles.recordingBubble}>
            <View style={styles.stopSquare} />
          </View>
        </TouchableOpacity>

        <View style={styles.bottomRightFloating}>
          <TouchableOpacity style={styles.flipBtnBubble} onPress={onToggleCameraType}>
            <Ionicons name="camera-reverse-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <>
      <View style={styles.bottomSectionPost}>
        <TouchableOpacity style={styles.undoPill} onPress={onUndo}>
          <Text style={styles.undoText}>Hoàn tác</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onRecordPress}>
          <View style={styles.postRecordOuter}>
            <View style={styles.postRecordInner} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.nextPill} onPress={onNext}>
          <Text style={styles.nextText}>Tiếp</Text>
          <Ionicons name="chevron-forward" size={18} color="#000" />
        </TouchableOpacity>
      </View>

      <View style={styles.bottomLeftFloating}>
        <TouchableOpacity style={styles.galleryPreviewSmall} onPress={onGoToGallery}>
          {lastClipUri || gallery[0] ? (
            <Image
              source={{ uri: lastClipUri ?? gallery[0]?.uri }}
              style={styles.galleryPreviewSmallImg}
            />
          ) : (
            <View style={styles.galleryPreviewSmallImgEmpty}>
              <Ionicons name="images-outline" size={20} color="#fff" />
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.bottomRightFloating}>
        <TouchableOpacity style={styles.flipBtnBubble} onPress={onToggleCameraType}>
          <Ionicons name="camera-reverse-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  bottomSectionIdle: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 100,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 20,
  },

  galleryPreviewBtn: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryPreviewThumb: {
    width: '100%',
    height: '100%',
  },
  galleryPreviewThumbEmpty: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  idleRecordOuter: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 4,
    borderColor: '#fff',
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  idleRecordInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fff',
  },

  flipBtnBubble: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // RECORDING
  bottomSectionRecording: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 100,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 30,
  },

  recordingBubble: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 4,
    borderColor: '#aaa',
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopSquare: {
    width: 32,
    height: 32,
    borderRadius: 4,
    backgroundColor: '#fff',
  },

  bottomRightFloating: {
    position: 'absolute',
    right: 16,
    bottom: 0,
  },

  bottomSectionPost: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 100,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 40,
  },

  undoPill: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  undoText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },

  postRecordOuter: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 4,
    borderColor: '#fff',
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  postRecordInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#1a1a1a',
  },

  nextPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  nextText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 4,
  },

  bottomLeftFloating: {
    position: 'absolute',
    left: 16,
    bottom: 28,
    zIndex: 45,
  },
  galleryPreviewSmall: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryPreviewSmallImg: {
    width: '100%',
    height: '100%',
  },
  galleryPreviewSmallImgEmpty: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
