import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { Video, ResizeMode } from 'expo-av';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type PreviewEditOverlayProps = {
  uri: string;
  mediaType?: 'photo' | 'video';
  onClose: () => void;
  onNext: () => void;
};

export const PreviewEditOverlay: React.FC<PreviewEditOverlayProps> = ({
  uri,
  mediaType = 'photo',
  onClose,
  onNext,
}) => {
  return (
    <View style={styles.overlayRoot}>
      <StatusBar hidden style="light" />

      <View style={styles.topBar}>
        <TouchableOpacity style={styles.topBubble} onPress={onClose}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.mediaArea}>
        {mediaType === 'video' ? (
          <Video
            source={{ uri }}
            style={styles.mediaImage}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay
            isLooping
            isMuted={false}
            useNativeControls={false}
          />
        ) : (
          <Image source={{ uri }} style={styles.mediaImage} resizeMode="contain" />
        )}
      </View>

      <View style={styles.bottomSheet}>
        <View style={styles.bottomRow}>
          <TouchableOpacity style={styles.nextBtn} onPress={onNext}>
            <Text style={styles.nextBtnText}>Tiếp</Text>
            <Ionicons name="chevron-forward" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

function ActionIcon({
  name,
  fallback,
}: {
  name: keyof typeof Ionicons.glyphMap;
  label?: string;
  fallback?: string;
}) {
  return (
    <View style={styles.actionIconBox}>
      {fallback ? (
        <Text style={styles.fallbackText}>{fallback}</Text>
      ) : (
        <Ionicons name={name} size={22} color="#fff" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlayRoot: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: '#000',
    zIndex: 999,
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 16,
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

  soundInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
    paddingHorizontal: 8,
  },
  soundAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#444',
    marginRight: 8,
  },
  soundTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  soundSubtitle: {
    color: '#ccc',
    fontSize: 12,
    fontWeight: '400',
  },

  mediaArea: {
    flex: 1,
    width: '100%',
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },

  bottomSheet: {
    backgroundColor: '#000',
    paddingBottom: 24,
    paddingTop: 12,
  },

  iconRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingBottom: 16,
    flexWrap: 'nowrap',
  },
  actionIconBox: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  fallbackText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },

  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
  },

  editBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  editBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },

  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4a3bff',
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  nextBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 4,
  },
});
