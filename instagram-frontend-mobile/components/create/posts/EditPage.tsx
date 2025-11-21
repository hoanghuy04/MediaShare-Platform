import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GalleryAsset } from '../../../types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PREVIEW_HEIGHT = SCREEN_HEIGHT * 0.5;

type EditPageProps = {
  height: number;
  selectedMedia: string[];
  gallery: GalleryAsset[];
  onBack: () => void;
  onNext: () => void;
};

export function EditPage({
  height,
  selectedMedia,
  gallery,
  onBack,
  onNext,
}: EditPageProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const selectedAssets = gallery.filter(asset => selectedMedia.includes(asset.id));
  const currentAsset = selectedAssets[currentIndex];

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      scrollViewRef.current?.scrollTo({
        x: (currentIndex - 1) * SCREEN_WIDTH,
        animated: true,
      });
    }
  };

  const handleNext = () => {
    if (currentIndex < selectedAssets.length - 1) {
      setCurrentIndex(currentIndex + 1);
      scrollViewRef.current?.scrollTo({
        x: (currentIndex + 1) * SCREEN_WIDTH,
        animated: true,
      });
    }
  };

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    if (index !== currentIndex && index >= 0 && index < selectedAssets.length) {
      setCurrentIndex(index);
    }
  };

  return (
    <View style={[styles.page, { height }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={onBack} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bài viết mới</Text>
        <TouchableOpacity onPress={onNext} style={styles.headerButton}>
          <Text style={styles.nextText}>Tiếp</Text>
        </TouchableOpacity>
      </View>

      {/* Music Selection */}
      <View style={styles.musicSection}>
        <View style={styles.musicItem}>
          <Image
            source={{ uri: 'https://picsum.photos/40/40?random=20' }}
            style={styles.musicThumbnail}
          />
          <View style={styles.musicInfo}>
            <Text style={styles.musicTitle}>Vào Một Ngày Khác</Text>
            <Text style={styles.musicSubtitle}>Âm thanh gợi ý</Text>
          </View>
          <TouchableOpacity style={styles.addButton}>
            <Ionicons name="add" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Preview Container - Chiếm 50% screen height */}
      <View style={styles.previewContainer}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {selectedAssets.map((asset, index) => (
            <View key={asset.id} style={styles.previewItem}>
              <Image
                source={{ uri: asset.uri }}
                style={styles.previewImage}
                resizeMode="cover"
              />
            </View>
          ))}
        </ScrollView>

        {/* Navigation dots */}
        {selectedAssets.length > 1 && (
          <View style={styles.dotsContainer}>
            {selectedAssets.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  index === currentIndex && styles.activeDot,
                ]}
              />
            ))}
          </View>
        )}

        {/* Navigation arrows */}
        {selectedAssets.length > 1 && (
          <>
            {currentIndex > 0 && (
              <TouchableOpacity style={styles.navArrow} onPress={handlePrevious}>
                <Ionicons name="chevron-back" size={24} color="white" />
              </TouchableOpacity>
            )}
            {currentIndex < selectedAssets.length - 1 && (
              <TouchableOpacity style={[styles.navArrow, styles.navArrowRight]} onPress={handleNext}>
                <Ionicons name="chevron-forward" size={24} color="white" />
              </TouchableOpacity>
            )}
          </>
        )}
      </View>

      {/* Edit Tools - Được đẩy xuống dưới */}
      <View style={styles.editTools}>
        <View style={styles.toolsRow}>
          <TouchableOpacity style={styles.editTool}>
            <View style={styles.toolIcon}>
              <Ionicons name="musical-notes" size={24} color="white" />
            </View>
            <Text style={styles.editToolText}>Nhạc</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.editTool}>
            <View style={styles.toolIcon}>
              <Ionicons name="text" size={24} color="white" />
            </View>
            <Text style={styles.editToolText}>Văn bản</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.editTool}>
            <View style={styles.toolIcon}>
              <Ionicons name="layers" size={24} color="white" />
            </View>
            <Text style={styles.editToolText}>Lớp phủ</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.editTool}>
            <View style={styles.toolIcon}>
              <Ionicons name="color-filter" size={24} color="white" />
            </View>
            <Text style={styles.editToolText}>Bộ lọc</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.editTool}>
            <View style={styles.toolIcon}>
              <Ionicons name="options" size={24} color="white" />
            </View>
            <Text style={styles.editToolText}>Chỉnh sửa</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#000',
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  nextText: {
    color: '#3897f0',
    fontSize: 16,
    fontWeight: '600',
  },
  musicSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  musicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
  },
  musicThumbnail: {
    width: 40,
    height: 40,
    borderRadius: 4,
  },
  musicInfo: {
    flex: 1,
    marginLeft: 12,
  },
  musicTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  musicSubtitle: {
    color: '#666',
    fontSize: 14,
    marginTop: 2,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewContainer: {
    height: PREVIEW_HEIGHT,
    backgroundColor: '#1a1a1a',
    position: 'relative',
  },
  previewItem: {
    width: SCREEN_WIDTH,
    height: '100%',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  dotsContainer: {
    position: 'absolute',
    top: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  activeDot: {
    backgroundColor: 'white',
  },
  navArrow: {
    position: 'absolute',
    top: '50%',
    left: 16,
    transform: [{ translateY: -20 }],
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navArrowRight: {
    left: undefined,
    right: 16,
  },
  editTools: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#000',
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  toolsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  editTool: {
    alignItems: 'center',
  },
  toolIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  editToolText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
});