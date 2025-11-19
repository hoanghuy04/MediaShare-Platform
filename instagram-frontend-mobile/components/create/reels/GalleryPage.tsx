import React from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TILE_GAP = 2;
const TILE_SIZE = (SCREEN_WIDTH - 24 - TILE_GAP * 2) / 3;

import type * as MediaLibrary from 'expo-media-library';

type GalleryAsset = {
  id: string;
  uri: string;
  mediaType: MediaLibrary.MediaTypeValue;
  duration?: number;
};

type GalleryPageProps = {
  height: number;
  gallery: GalleryAsset[];
  loadingGallery: boolean;
  onGoToCamera: () => void;
  onScrollBeginDrag: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onScrollEndDrag: () => void;
  onOpenPreview: (uri: string) => void;
};

export function GalleryPage({
  height,
  gallery,
  loadingGallery,
  onGoToCamera,
  onScrollBeginDrag,
  onScroll,
  onScrollEndDrag,
  onOpenPreview,
}: GalleryPageProps) {
  const insets = useSafeAreaInsets();
  
  const gridItems = [
    { type: 'camera' as const },
    ...gallery.map(a => ({ type: 'asset' as const, item: a })),
  ];

  const rows: (typeof gridItems)[] = [];
  for (let i = 0; i < gridItems.length; i += 3) {
    rows.push(gridItems.slice(i, i + 3));
  }

  return (
    <View style={[styles.page, { height }]}>
      <View style={[styles.galleryHeaderBar, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.closeBtn} onPress={onGoToCamera}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.galleryHeaderTitle}>Thước phim mới</Text>

        <TouchableOpacity style={styles.settingsBtn}>
          <Ionicons name="settings-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.galleryActionRow}>
        <View style={styles.galleryChip}>
          <Ionicons name="logo-instagram" size={18} color="#fff" style={{ marginRight: 6 }} />
          <Text style={styles.galleryChipText}>Edits</Text>
        </View>

        <View style={styles.galleryChip}>
          <Ionicons name="scan-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
          <Text style={styles.galleryChipText}>Bản nháp</Text>
        </View>

        <View style={styles.galleryChip}>
          <Ionicons name="copy-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
          <Text style={styles.galleryChipText}>Mẫu</Text>
        </View>
      </View>

      <View style={styles.gallerySubHeaderRow}>
        <Text style={styles.subHeaderText}>Mới đây ▼</Text>

        <TouchableOpacity style={styles.squareSelectBtn}>
          <Ionicons name="checkbox-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

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
                    onPress={() => onOpenPreview(asset.uri)}
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

          <View style={{ height: 100 }} />
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

  galleryActionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    columnGap: 8,
    rowGap: 8,
  },
  galleryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  galleryChipText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },

  gallerySubHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    justifyContent: 'space-between',
  },
  subHeaderText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  squareSelectBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
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
