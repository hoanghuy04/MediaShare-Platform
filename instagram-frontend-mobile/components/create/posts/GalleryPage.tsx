import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TILE_GAP = 1; // Giảm gap để giống Instagram
const TILE_SIZE = (SCREEN_WIDTH - TILE_GAP * 2) / 3; // Bỏ padding để full width
const PREVIEW_HEIGHT = SCREEN_WIDTH * 0.8;

type GalleryAsset = {
  id: string;
  uri: string;
  mediaType: 'photo' | 'video';
  duration?: number;
};

type GalleryPageProps = {
  height: number;
  gallery: GalleryAsset[];
  loadingGallery: boolean;
  selectedMedia: string[];
  onGoToCamera: () => void;
  onScrollBeginDrag: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onScrollEndDrag: () => void;
  onSelectMedia: (id: string) => void;
  onNext: () => void;
};

export function GalleryPage({
  height,
  gallery,
  loadingGallery,
  selectedMedia,
  onGoToCamera,
  onScrollBeginDrag,
  onScroll,
  onScrollEndDrag,
  onSelectMedia,
  onNext,
}: GalleryPageProps) {
  const scrollY = useRef(new Animated.Value(0)).current;
  
  const gridItems = [
    { type: 'camera' as const },
    ...gallery.map(a => ({ type: 'asset' as const, item: a })),
  ];

  const rows: (typeof gridItems)[] = [];
  for (let i = 0; i < gridItems.length; i += 3) {
    rows.push(gridItems.slice(i, i + 3));
  }

  // Get first selected asset for preview
  const previewAsset = gallery.find(asset => selectedMedia.includes(asset.id));

  // Animation for preview height
  const previewHeight = scrollY.interpolate({
    inputRange: [0, PREVIEW_HEIGHT],
    outputRange: [PREVIEW_HEIGHT, 0],
    extrapolate: 'clamp',
  });

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    scrollY.setValue(offsetY);
    onScroll(event);
  };

  return (
    <View style={[styles.page, { height }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={onGoToCamera}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Bài viết mới</Text>

        <TouchableOpacity 
          style={[styles.nextBtn, { opacity: selectedMedia.length > 0 ? 1 : 0.5 }]}
          onPress={onNext}
          disabled={selectedMedia.length === 0}
        >
          <Text style={styles.nextBtnText}>Tiếp</Text>
        </TouchableOpacity>
      </View>

      {/* Preview Image */}
      <Animated.View style={[styles.previewContainer, { height: previewHeight }]}>
        {previewAsset ? (
          <Image
            source={{ uri: previewAsset.uri }}
            style={styles.previewImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.previewPlaceholder}>
            <Ionicons name="camera-outline" size={80} color="#666" />
            <Text style={styles.previewPlaceholderText}>Chọn ảnh để xem trước</Text>
          </View>
        )}
        
        {/* Expand button */}
        {previewAsset && (
          <TouchableOpacity style={styles.expandButton}>
            <Ionicons name="expand" size={20} color="white" />
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* Gallery Section */}
      <View style={styles.gallerySection}>
        <View style={styles.galleryHeader}>
          <Text style={styles.galleryTitle}>Gần đây</Text>
          <Ionicons name="chevron-down" size={20} color="#fff" />
        </View>

        {loadingGallery ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Đang tải thư viện...</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.galleryScroll}
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={16}
            bounces={false}
            onScrollBeginDrag={onScrollBeginDrag}
            onScroll={handleScroll}
            onScrollEndDrag={onScrollEndDrag}
            onMomentumScrollEnd={onScrollEndDrag}
          >
            {rows.map((row, rowIdx) => (
              <View key={`row-${rowIdx}`} style={styles.row}>
                {row.map((cell, cellIdx) => {
                  if (cell.type === 'camera') {
                    return (
                      <TouchableOpacity
                        key={`cell-${rowIdx}-${cellIdx}-camera`}
                        style={styles.cameraTile}
                        activeOpacity={0.8}
                        onPress={onGoToCamera}
                      >
                        <Ionicons name="camera-outline" size={32} color="#fff" />
                      </TouchableOpacity>
                    );
                  }
                  const asset = cell.item;
                  const isSelected = selectedMedia.includes(asset.id);
                  return (
                    <TouchableOpacity
                      key={asset.id ?? `cell-${rowIdx}-${cellIdx}`}
                      style={styles.assetTile}
                      activeOpacity={0.8}
                      onPress={() => onSelectMedia(asset.id)}
                    >
                      <Image
                        source={{ uri: asset.uri }}
                        style={styles.assetImage}
                        resizeMode="cover"
                      />
                      
                      {asset.mediaType === 'video' && (
                        <View style={styles.videoIndicator}>
                          <Ionicons name="play" size={12} color="#fff" />
                        </View>
                      )}

                      {isSelected && (
                        <View style={styles.selectedOverlay}>
                          <View style={styles.selectedNumber}>
                            <Text style={styles.selectedNumberText}>
                              {selectedMedia.indexOf(asset.id) + 1}
                            </Text>
                          </View>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}

                {/* Fill remaining spaces */}
                {row.length < 3 &&
                  Array.from({ length: 3 - row.length }).map((_, fillerIdx) => (
                    <View key={`filler-${rowIdx}-${fillerIdx}`} style={styles.emptyTile} />
                  ))}
              </View>
            ))}

            <View style={{ height: 100 }} />
          </ScrollView>
        )}
      </View>
    </View>
  );
}

function formatDuration(sec?: number) {
  if (!sec || sec <= 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? `0${s}` : s}`;
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#000',
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  nextBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  nextBtnText: {
    color: '#3897f0',
    fontSize: 16,
    fontWeight: '600',
  },

  // Preview styles
  previewContainer: {
    width: '100%',
    backgroundColor: '#1a1a1a',
    overflow: 'hidden',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewPlaceholderText: {
    color: '#666',
    fontSize: 16,
    marginTop: 12,
  },
  expandButton: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Gallery styles
  gallerySection: {
    flex: 1,
  },
  galleryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  galleryTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: '#888',
  },
  galleryScroll: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    marginBottom: TILE_GAP,
  },
  cameraTile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: TILE_GAP,
  },
  assetTile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    backgroundColor: '#222',
    position: 'relative',
    marginRight: TILE_GAP,
  },
  assetImage: {
    width: '100%',
    height: '100%',
  },
  emptyTile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    backgroundColor: 'transparent',
  },
  videoIndicator: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  selectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3897f0',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 8,
    right: 8,
  },
  selectedNumberText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});