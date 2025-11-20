import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type * as MediaLibrary from 'expo-media-library';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TILE_GAP = 2;
const TILE_SIZE = (SCREEN_WIDTH - 24 - TILE_GAP * 2) / 3;

type GalleryAsset = {
  id: string;
  uri: string;
  mediaType: MediaLibrary.MediaTypeValue;
  duration?: number;
};

type FilterType = 'recent' | 'photo' | 'video' | 'albums';

type GalleryPageProps = {
  height: number;
  gallery: GalleryAsset[];
  loadingGallery: boolean;
  onGoToCamera: () => void;
  onOpenPreview: (uri: string) => void;
  onOpenAlbumPicker?: () => void;
  onClose: () => void;

  onScrollBeginDrag: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onScrollEndDrag: () => void;
};

export function ReelGaleryView({
  height,
  gallery,
  loadingGallery,
  onGoToCamera,
  onOpenPreview,
  onOpenAlbumPicker,
  onClose,
  onScrollBeginDrag,
  onScroll,
  onScrollEndDrag,
}: GalleryPageProps) {
  const [filterType, setFilterType] = useState<FilterType>('recent');
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);

  const filteredGallery = useMemo(() => {
    switch (filterType) {
      case 'photo':
        return gallery.filter(asset => asset.mediaType === 'photo');
      case 'video':
        return gallery.filter(asset => asset.mediaType === 'video');
      default:
        return gallery;
    }
  }, [filterType, gallery]);

  const gridItems = [
    { type: 'camera' as const },
    ...filteredGallery.map(a => ({ type: 'asset' as const, item: a })),
  ];

  const rows: (typeof gridItems)[] = [];
  for (let i = 0; i < gridItems.length; i += 3) {
    rows.push(gridItems.slice(i, i + 3));
  }

  const handleFilterSelect = useCallback(
    (nextFilter: FilterType) => {
      setFilterMenuVisible(false);
      if (nextFilter === 'albums') {
        onOpenAlbumPicker?.();
        return;
      }
      setFilterType(nextFilter);
    },
    [onOpenAlbumPicker]
  );

  const handleAssetPress = (asset: GalleryAsset) => {
    onOpenPreview(asset.uri);
  };

  const getFilterLabel = () => {
    switch (filterType) {
      case 'photo':
        return <Text style={styles.subHeaderText}>Ảnh</Text>;
      case 'video':
        return <Text style={styles.subHeaderText}>Video</Text>;
      case 'albums':
        return <Text style={styles.subHeaderText}>Tất cả album</Text>;
      default:
        return <Text style={styles.subHeaderText}>Mới đây</Text>;
    }
  };

  return (
    <View style={[styles.page, { height }]}>
      <View style={styles.galleryHeaderBar}>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.galleryHeaderTitle}>Thước phim mới</Text>

        <TouchableOpacity style={styles.settingsBtn}>
          <Ionicons name="settings-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.gallerySubHeaderRow}>
        <TouchableOpacity
          style={styles.filterDropdown}
          onPress={() => setFilterMenuVisible(prev => !prev)}
        >
          {getFilterLabel()}
          <Ionicons
            name={filterMenuVisible ? 'chevron-up' : 'chevron-down'}
            size={18}
            color="#fff"
          />
        </TouchableOpacity>
      </View>

      {filterMenuVisible && (
        <View pointerEvents="box-none" style={styles.filterMenuOverlay}>
          <View style={styles.filterMenu}>
            <TouchableOpacity
              style={styles.filterMenuItem}
              onPress={() => handleFilterSelect('recent')}
            >
              <Ionicons name="time-outline" size={16} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.filterMenuText}>Mới đây</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.filterMenuItem}
              onPress={() => handleFilterSelect('photo')}
            >
              <Ionicons name="image-outline" size={16} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.filterMenuText}>Ảnh</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.filterMenuItem}
              onPress={() => handleFilterSelect('video')}
            >
              <Ionicons name="videocam-outline" size={16} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.filterMenuText}>Video</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.filterMenuItem}
              onPress={() => handleFilterSelect('albums')}
            >
              <Ionicons name="albums-outline" size={16} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.filterMenuText}>Tất cả ảnh</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {loadingGallery ? (
        <View style={{ paddingVertical: 40, alignItems: 'center' }}>
          <Text style={{ color: '#888' }}>Đang tải thư viện...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.galleryGridScroll}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          bounces={false}
          nestedScrollEnabled
          // 👇 forward các event cho ReelsCreationScreen xử lý kéo lên/kéo xuống
          onScrollBeginDrag={onScrollBeginDrag}
          onScroll={onScroll}
          onScrollEndDrag={onScrollEndDrag}
          onMomentumScrollEnd={onScrollEndDrag}
        >
          {rows.map((row, rowIdx) => (
            <View
              key={`row-${rowIdx}`}
              style={[styles.rowWrapper, rowIdx !== 0 && { marginTop: TILE_GAP }]}
            >
              {row.map((cell, cellIdx) => {
                if (cell.type === 'camera') {
                  return (
                    <TouchableOpacity
                      key={`cell-${rowIdx}-${cellIdx}-camera`}
                      style={[styles.tileBase, styles.cameraTile]}
                      activeOpacity={0.8}
                      onPress={onGoToCamera}
                    >
                      <Ionicons name="camera-outline" size={32} color="#fff" />
                    </TouchableOpacity>
                  );
                }
                const asset = cell.item;
                return (
                  <TouchableOpacity
                    key={asset.id ?? `cell-${rowIdx}-${cellIdx}`}
                    style={[styles.tileBase, styles.assetWrapper]}
                    activeOpacity={0.8}
                    onPress={() => handleAssetPress(asset)}
                  >
                    <Image
                      source={{ uri: asset.uri }}
                      style={styles.assetThumb}
                      resizeMode="cover"
                    />

                    {asset.mediaType === 'video' && (
                      <View style={styles.durationBadge}>
                        <Ionicons
                          name="videocam"
                          size={12}
                          color="#fff"
                          style={{ marginRight: 2 }}
                        />
                        <Text style={styles.durationText}>{formatDuration(asset.duration)}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}

              {row.length < 3 &&
                Array.from({ length: 3 - row.length }).map((_, fillerIdx) => (
                  <View
                    key={`filler-${rowIdx}-${fillerIdx}`}
                    style={[styles.tileBase, { backgroundColor: 'transparent' }]}
                  />
                ))}
            </View>
          ))}

          <View style={{ height: 140 }} />
        </ScrollView>
      )}
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
    paddingTop: 16,
    paddingHorizontal: 12,
    position: 'relative',
  },

  galleryHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryHeaderTitle: {
    flex: 1,
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  settingsBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },

  gallerySubHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    justifyContent: 'space-between',
  },
  filterDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 6,
  },
  subHeaderText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  filterMenuOverlay: {
    position: 'absolute',
    top: 110,
    left: 12,
    right: 12,
    zIndex: 10,
  },
  filterMenu: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    width: '50%',
  },
  filterMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 15,
  },
  filterMenuText: {
    color: '#fff',
    fontSize: 16,
  },

  galleryGridScroll: {
    flexGrow: 0,
  },

  rowWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  tileBase: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
    position: 'relative',
  },

  cameraTile: {
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },

  assetWrapper: {
    backgroundColor: '#222',
  },
  assetThumb: {
    width: '100%',
    height: '100%',
  },

  durationBadge: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  durationText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '500',
  },
});
