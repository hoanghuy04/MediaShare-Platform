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
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LocationSearchScreen } from '../reels/LocationSearchScreen';
import { uploadAPI, postAPI } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { extractHashtags } from '@/utils/hashtag';
import { CreatePostRequest, Media } from '@/types';
import apiConfig from '@/config/apiConfig';
import { isVideoFormatSupported } from '@/utils/videoUtils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PREVIEW_WIDTH = SCREEN_WIDTH * 0.4;
const PREVIEW_HEIGHT = PREVIEW_WIDTH;

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
  onPostCreated?: () => void; // Callback để refresh feed
};

export function SharePage({
  selectedMedia,
  gallery,
  onBack,
  onShare,
  hideTabbedFlow = false,
  onPostCreated,
}: SharePageProps) {
  const { user } = useAuth();
  const router = useRouter();
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

  const validateVideoFormat = (asset: GalleryAsset): boolean => {
    if (asset.mediaType === 'video') {
      return isVideoFormatSupported(asset.uri);
    }
    return true;
  };

  const handleShare = async () => {
    if (isSharing) return;

    setIsSharing(true);
    try {
      const unsupportedVideos = selectedAssets.filter(asset => !validateVideoFormat(asset));
      if (unsupportedVideos.length > 0) {
        Alert.alert(
          'Video Format Not Supported',
          'Some videos have unsupported formats and will be treated as images.',
          [{ text: 'OK' }]
        );
      }

      const hashtags = extractHashtags(caption);
      console.log('Extracted hashtags:', hashtags);

      // Upload media files first
      console.log('Starting media upload...');
      const uploadedMedia = await Promise.all(
        selectedAssets.map(async (asset, index) => {
          console.log(`Uploading asset ${index + 1}:`, asset);
          const formData = new FormData();
          const filename = asset.uri.split('/').pop() || 'upload';

          // Determine file type and extension
          let fileExtension = filename.split('.').pop()?.toLowerCase() || '';
          let mimeType = '';

          // Check if video format is supported
          const isVideoSupported = asset.mediaType === 'video' && isVideoFormatSupported(asset.uri);

          if (asset.mediaType === 'video' && isVideoSupported) {
            if (['mp4', 'mov', 'avi', 'mkv', 'm4v'].includes(fileExtension)) {
              mimeType = `video/${fileExtension}`;
            } else {
              mimeType = 'video/mp4';
              fileExtension = 'mp4';
            }
          } else {
            // Treat as image if video format is not supported
            if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension)) {
              mimeType = `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`;
            } else {
              mimeType = 'image/jpeg';
              fileExtension = 'jpg';
            }
          }

          console.log(`Asset ${index + 1} - MIME type:`, mimeType, 'Extension:', fileExtension);

          formData.append('file', {
            uri: asset.uri,
            type: mimeType,
            name: `upload.${fileExtension}`,
          } as any);

          // Check if this is a mock URL (picsum.photos)
          if (asset.uri.includes('picsum.photos')) {
            console.log(`Asset ${index + 1} is mock data, skipping upload`);
            return {
              url: asset.uri, // Use mock URL directly
              type: asset.mediaType === 'video' ? 'VIDEO' : 'IMAGE',
            } as Media;
          }

          const uploadResponse = await uploadAPI.uploadFile(formData, 'post', user?.id);
          console.log(`Asset ${index + 1} uploaded successfully:`, uploadResponse);
          console.log(`Asset ${index + 1} upload response type:`, typeof uploadResponse);
          console.log(`Asset ${index + 1} upload response length:`, uploadResponse?.length);

          // Backend returns full URL, no need to modify
          let mediaUrl = uploadResponse;

          // If it's a relative path (shouldn't happen with current backend), make it absolute
          if (typeof mediaUrl === 'string' && !mediaUrl.startsWith('http')) {
            mediaUrl = `${apiConfig.apiUrl}${mediaUrl}`;
            console.log(`Asset ${index + 1} converted to absolute URL:`, mediaUrl);
          }

          console.log(`Asset ${index + 1} final media URL:`, mediaUrl);

          return {
            url: mediaUrl,
            type: asset.mediaType === 'video' && isVideoSupported ? 'VIDEO' : 'IMAGE',
          } as Media;
        })
      );

      console.log('All media uploaded successfully:', uploadedMedia);

      // Create post with uploaded media
      const postData: CreatePostRequest = {
        caption,
        media: uploadedMedia,
        tags: hashtags,
        location: pickedLocation?.name,
      };

      console.log('Creating post with data:', postData);
      const newPost = await postAPI.createPost(postData);
      console.log('Post created successfully:', newPost);

      // Show success message
      Alert.alert('Thành công', 'Bài viết đã được chia sẻ!', [
        {
          text: 'OK',
          onPress: () => {
            // Trigger refresh feed
            onPostCreated?.();
            // Navigate to feed after successful post creation
            router.push('/(tabs)/feed');
          },
        },
      ]);

      // Call onShare callback to close the screen
      await onShare({
        mediaUris: selectedAssets.map(asset => asset.uri),
        mediaType: selectedAssets[0]?.mediaType || 'photo',
        caption,
        hashtags,
        location: pickedLocation
          ? {
              name: pickedLocation.name,
              address: pickedLocation.address,
              distance: pickedLocation.distance,
            }
          : undefined,
        aiTagEnabled,
      });
    } catch (error: any) {
      console.error('Error sharing post:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      Alert.alert('Lỗi', `Không thể chia sẻ bài viết: ${error.message || 'Unknown error'}`);
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
        onSelectLocation={loc => {
          setPickedLocation({
            name: loc.name,
            address: loc.address,
            distance: loc.distance,
          });
          setShowLocationSearch(false);
        }}
        onClose={() => setShowLocationSearch(false)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bài viết mới</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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

        <View style={styles.optionsSection}>
          <TouchableOpacity style={styles.optionRow}>
            <View style={styles.optionLeft}>
              <Ionicons name="list" size={24} color="#000" />
              <Text style={styles.optionText}>Cuộc thăm dò ý kiến</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionRow}>
            <View style={styles.optionLeft}>
              <Ionicons name="search" size={24} color="#000" />
              <Text style={styles.optionText}>Gợi ý</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

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

          <TouchableOpacity style={styles.optionRow}>
            <View style={styles.optionLeft}>
              <Ionicons name="person-add" size={24} color="#000" />
              <Text style={styles.optionText}>Gắn thẻ người khác</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionRow} onPress={() => setShowLocationSearch(true)}>
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
                  Chúng tôi yêu cầu bạn gắn nhãn cho một số nội dung nhất định tạo bằng AI và cảm
                  giác như thật. Tìm hiểu thêm
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
