import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  Dimensions,
  SafeAreaView,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LocationSearchScreen } from '../reels/LocationSearchScreen';
import { uploadAPI, postAPI } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { extractHashtags } from '@/utils/hashtag';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PREVIEW_WIDTH = SCREEN_WIDTH * 0.4; // Tăng từ 25% lên 40% để dễ xem hơn
const PREVIEW_HEIGHT = PREVIEW_WIDTH; // Square aspect ratio

type GalleryAsset = {
  id: string;
  uri: string;
  mediaType: 'photo' | 'video';
  duration?: number;
};

type PickedLocation = {
  name: string;
  address?: string;
  distance?: string;
} | null;

export type PostData = {
  mediaUris: string[];
  mediaType: 'photo' | 'video';
  caption: string;
  hashtags: string[];
  location?: {
    name: string;
    address?: string;
    distance?: string;
  };
  aiTagEnabled: boolean;
};

type SharePageProps = {
  selectedMedia: string[];
  gallery: GalleryAsset[];
  onBack: () => void;
  onShare: (data: PostData) => void;
  hideTabbedFlow?: boolean;
};

export function SharePage({ selectedMedia, gallery, onBack, onShare, hideTabbedFlow = false }: SharePageProps) {
  const { user } = useAuth();
  const [caption, setCaption] = useState('');
  const [showLocationSearch, setShowLocationSearch] = useState(false);
  const [pickedLocation, setPickedLocation] = useState<PickedLocation>(null);
  const [aiTagEnabled, setAiTagEnabled] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const selectedAssets = gallery.filter(asset => selectedMedia.includes(asset.id));

  const handleLocationSelect = (location: PickedLocation) => {
    setPickedLocation(location);
    setShowLocationSearch(false);
  };

  const handleShare = async () => {
    if (isSharing) return;

    setIsSharing(true);
    try {
      const hashtags = extractHashtags(caption);
      
      const postData: PostData = {
        mediaUris: selectedAssets.map(asset => asset.uri),
        mediaType: selectedAssets[0]?.mediaType || 'photo',
        caption,
        hashtags,
        location: pickedLocation ? {
          name: pickedLocation.name,
          address: pickedLocation.address,
          distance: pickedLocation.distance,
        } : undefined,
        aiTagEnabled,
      };

      await onShare(postData);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể chia sẻ bài viết. Vui lòng thử lại.');
    } finally {
      setIsSharing(false);
    }
  };

  const handlePreviewScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / PREVIEW_WIDTH);
    if (index !== currentPreviewIndex && index >= 0 && index < selectedAssets.length) {
      setCurrentPreviewIndex(index);
    }
  };

  if (showLocationSearch) {
    return (
      <LocationSearchScreen
        onLocationSelect={handleLocationSelect}
        onBack={() => setShowLocationSearch(false)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bài viết mới</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Preview Section - Ở đầu như hình */}
        {selectedAssets.length > 0 && (
          <View style={styles.previewSection}>
            <View style={styles.previewContainer}>
              <ScrollView
                ref={scrollViewRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                onScroll={handlePreviewScroll}
                scrollEventThrottle={16}
                style={styles.previewScroll}
                contentContainerStyle={styles.previewScrollContent}
              >
                {selectedAssets.map((asset, index) => (
                  <View key={asset.id} style={styles.previewItem}>
                    <Image
                      source={{ uri: asset.uri }}
                      style={styles.previewImage}
                      resizeMode="cover"
                    />
                    {asset.mediaType === 'video' && (
                      <View style={styles.videoIndicator}>
                        <Ionicons name="play" size={12} color="white" />
                      </View>
                    )}
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        )}

        {/* Caption Input */}
        <View style={styles.captionSection}>
          <TextInput
            style={styles.captionInput}
            placeholder="Thêm chú thích..."
            placeholderTextColor="#999"
            value={caption}
            onChangeText={setCaption}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Post Options */}
        <View style={styles.optionsSection}>
          {/* Poll */}
          <TouchableOpacity style={styles.optionRow}>
            <View style={styles.optionLeft}>
              <Ionicons name="list" size={24} color="#000" />
              <Text style={styles.optionText}>Cuộc thăm dò ý kiến</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          {/* Suggestions */}
          <TouchableOpacity style={styles.optionRow}>
            <View style={styles.optionLeft}>
              <Ionicons name="search" size={24} color="#000" />
              <Text style={styles.optionText}>Gợi ý</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          {/* Add Sound */}
          <View style={styles.optionRow}>
            <View style={styles.optionLeft}>
              <Ionicons name="musical-notes" size={24} color="#000" />
              <Text style={styles.optionText}>Thêm âm thanh</Text>
            </View>
            <View style={styles.soundPreview}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.soundItem}>
                  <Image
                    source={{ uri: 'https://picsum.photos/30/30?random=1' }}
                    style={styles.soundThumbnail}
                  />
                  <Text style={styles.soundText}>HIỆN THỰC PHŨ PHÀNG...</Text>
                </View>
                <View style={styles.soundItem}>
                  <Image
                    source={{ uri: 'https://picsum.photos/30/30?random=2' }}
                    style={styles.soundThumbnail}
                  />
                  <Text style={styles.soundText}>3 Bích • Pháp Kiề...</Text>
                </View>
              </ScrollView>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </View>
          </View>

          {/* Tag People */}
          <TouchableOpacity style={styles.optionRow}>
            <View style={styles.optionLeft}>
              <Ionicons name="person-add" size={24} color="#000" />
              <Text style={styles.optionText}>Gắn thẻ người khác</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          {/* Add Location */}
          <TouchableOpacity 
            style={styles.optionRow}
            onPress={() => setShowLocationSearch(true)}
          >
            <View style={styles.optionLeft}>
              <Ionicons name="location" size={24} color="#000" />
              <Text style={styles.optionText}>Thêm vị trí</Text>
            </View>
            <View style={styles.locationPreview}>
              {pickedLocation ? (
                <>
                  <Text style={styles.locationText}>{pickedLocation.name}</Text>
                  {pickedLocation.address && (
                    <Text style={styles.locationSubtext}>{pickedLocation.address}</Text>
                  )}
                </>
              ) : (
                <>
                  <Text style={styles.locationText}>IUH - Trường Đại học Công nghi...</Text>
                  <Text style={styles.locationSubtext}>Thành phố Hồ Chí Min</Text>
                </>
              )}
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </View>
          </TouchableOpacity>

          {/* AI Label */}
          <View style={styles.optionRow}>
            <View style={styles.optionLeft}>
              <Ionicons name="sparkles" size={24} color="#000" />
              <Text style={styles.optionText}>Thêm nhãn AI</Text>
            </View>
            <View style={styles.aiLabelSection}>
              <View style={styles.aiLabelText}>
                <Text style={styles.aiLabelDescription}>
                  Chúng tôi yêu cầu bạn gắn nhãn cho một số nội dung nhất định tạo bằng AI và cảm giác như thật. Tìm hiểu thêm
                </Text>
              </View>
              <Switch
                value={aiTagEnabled}
                onValueChange={setAiTagEnabled}
                trackColor={{ false: '#ddd', true: '#007AFF' }}
                thumbColor={aiTagEnabled ? '#fff' : '#f4f3f4'}
              />
            </View>
          </View>

          {/* Also Share On */}
          <TouchableOpacity style={styles.optionRow}>
            <View style={styles.optionLeft}>
              <Ionicons name="share" size={24} color="#000" />
              <Text style={styles.optionText}>Cũng chia sẻ trên...</Text>
            </View>
            <View style={styles.sharePreview}>
              <Text style={styles.shareText}>@minnhiuu_</Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </View>
          </TouchableOpacity>

          {/* Other Options */}
          <TouchableOpacity style={styles.optionRow}>
            <View style={styles.optionLeft}>
              <Ionicons name="ellipsis-horizontal" size={24} color="#000" />
              <Text style={styles.optionText}>Lựa chọn khác</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Share Button */}
      <View style={styles.shareButtonContainer}>
        <TouchableOpacity
          style={[styles.shareButton, isSharing && styles.shareButtonDisabled]}
          onPress={handleShare}
          disabled={isSharing}
        >
          {isSharing ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.shareButtonText}>Chia sẻ</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  headerBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  previewSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  previewContainer: {
    alignItems: 'center',
  },
  previewScroll: {
    height: PREVIEW_HEIGHT,
  },
  previewScrollContent: {
    alignItems: 'center',
  },
  previewItem: {
    width: PREVIEW_WIDTH,
    height: PREVIEW_HEIGHT,
    marginRight: 8,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  videoIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  captionSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  captionInput: {
    color: '#000',
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  optionsSection: {
    paddingHorizontal: 16,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionText: {
    color: '#000',
    fontSize: 16,
    marginLeft: 16,
  },
  soundPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 16,
  },
  soundItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  soundThumbnail: {
    width: 30,
    height: 30,
    borderRadius: 4,
    marginRight: 8,
  },
  soundText: {
    color: '#000',
    fontSize: 14,
  },
  locationPreview: {
    flex: 1,
    marginLeft: 16,
  },
  locationText: {
    color: '#000',
    fontSize: 14,
  },
  locationSubtext: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
  },
  aiLabelSection: {
    flex: 1,
    marginLeft: 16,
  },
  aiLabelText: {
    marginBottom: 8,
  },
  aiLabelDescription: {
    color: '#666',
    fontSize: 12,
    lineHeight: 16,
  },
  audiencePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
  },
  audienceText: {
    color: '#000',
    fontSize: 14,
    marginRight: 8,
  },
  sharePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
  },
  shareText: {
    color: '#000',
    fontSize: 14,
    marginRight: 8,
  },
  shareButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  shareButton: {
    backgroundColor: '#007AFF', // Màu đậm hơn primary
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  shareButtonDisabled: {
    backgroundColor: '#999',
  },
  shareButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});