import React, { useRef, useState } from 'react';
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
import { Video, ResizeMode } from 'expo-av';
import { LocationSearchScreen } from './LocationSearchScreen';
import { uploadAPI, postAPI } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { extractHashtags } from '@/utils/hashtag';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PREVIEW_WIDTH = SCREEN_WIDTH * 0.4;
const PREVIEW_HEIGHT = PREVIEW_WIDTH * 1.78;

type PickedLocation = {
  name: string;
  address?: string;
  distance?: string;
} | null;

export type ReelPostData = {
  mediaUri: string;
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

type ReelPostScreenProps = {
  mediaUri: string;
  mediaType: 'photo' | 'video';
  onBack: () => void;
  onShare: (data: ReelPostData) => void;
};

export function ReelPostScreen({ mediaUri, mediaType, onBack, onShare }: ReelPostScreenProps) {
  const { user } = useAuth();
  const [caption, setCaption] = useState('');
  const [showLocationSearch, setShowLocationSearch] = useState(false);
  const [pickedLocation, setPickedLocation] = useState<PickedLocation>(null);
  const [aiTagEnabled, setAiTagEnabled] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const scrollRef = useRef<ScrollView | null>(null);
  const captionInputRef = useRef<TextInput | null>(null);

  const handleHashtagPress = () => {
    setCaption(prev => {
      if (prev.trim().length === 0) return '#';
      if (prev.endsWith(' ') || prev.endsWith('\n')) return prev + '#';
      return prev + ' #';
    });

    setTimeout(() => {
      captionInputRef.current?.focus();
    }, 50);
  };

  const handleShare = async () => {
    if (isUploading) return;

    if (!user || !user.id) {
      Alert.alert('Lỗi', 'Vui lòng đăng nhập để chia sẻ Reel.');
      return;
    }

    try {
      setIsUploading(true);

      const formData = new FormData();
      const filename = mediaUri.split('/').pop() || 'upload';

      let fileExtension = filename.split('.').pop()?.toLowerCase() || '';
      let mimeType = '';

      if (mediaType === 'video') {
        if (['mp4', 'mov', 'avi', 'mkv', 'm4v'].includes(fileExtension)) {
          mimeType = `video/${fileExtension}`;
        } else {
          mimeType = 'video/mp4';
          fileExtension = 'mp4';
        }
      } else {
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension)) {
          mimeType = `image/${fileExtension}`;
        } else {
          mimeType = 'image/jpeg';
          fileExtension = 'jpg';
        }
      }

      const newFilename = `upload_${Date.now()}.${fileExtension}`;

      formData.append('file', {
        uri: mediaUri,
        name: newFilename,
        type: mimeType,
      } as any);

      const mediaUrl = await uploadAPI.uploadFile(formData, 'post', user.id);

      const hashtags = extractHashtags(caption);

      const postData = {
        caption: caption.trim(),
        media: [
          {
            url: mediaUrl,
            type: mediaType === 'video' ? ('VIDEO' as const) : ('IMAGE' as const),
          },
        ],
        tags: hashtags,
        location: pickedLocation?.name,
      };

      const newPost = await postAPI.createPost(postData);

      Alert.alert('Thành công! 🎉', 'Reel của bạn đã được chia sẻ', [
        {
          text: 'OK',
          onPress: () => {
            const reelData: ReelPostData = {
              mediaUri,
              mediaType,
              caption: caption.trim(),
              hashtags,
              location: pickedLocation || undefined,
              aiTagEnabled,
            };
            onShare(reelData);
          },
        },
      ]);
    } catch (error: any) {
      Alert.alert(
        'Lỗi',
        error?.response?.data?.message || 'Không thể chia sẻ Reel. Vui lòng thử lại.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleSelectLocation = (loc: { name: string; address: string; distance: string }) => {
    setPickedLocation({
      name: loc.name,
      address: loc.address,
      distance: loc.distance,
    });
    setShowLocationSearch(false);
  };

  const handleRemoveLocation = () => {
    setPickedLocation(null);
  };

  if (showLocationSearch) {
    return (
      <LocationSearchScreen
        onClose={() => setShowLocationSearch(false)}
        onSelectLocation={handleSelectLocation}
      />
    );
  }

  const renderLocationSecondaryLine = () => {
    if (!pickedLocation) return null;
    const pieces: string[] = [];
    if (pickedLocation.distance && pickedLocation.distance.length > 0) {
      pieces.push(pickedLocation.distance);
    }
    if (pickedLocation.address && pickedLocation.address.length > 0) {
      pieces.push(pickedLocation.address);
    }
    return pieces.join(' · ');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={28} color="#000" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Thước phim mới</Text>

        <View style={styles.headerBtn} />
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 160 }}
      >
        <View style={styles.previewSection}>
          <View style={styles.previewContainer}>
            {mediaType === 'video' ? (
              <Video
                source={{ uri: mediaUri }}
                style={styles.previewMedia}
                resizeMode={ResizeMode.COVER}
                shouldPlay
                isLooping
                isMuted
              />
            ) : (
              <Image source={{ uri: mediaUri }} style={styles.previewMedia} resizeMode="cover" />
            )}

            <View style={styles.editTools}>
              <View style={styles.toolBtn}>
                <Ionicons name="musical-notes" size={18} color="#fff" />
              </View>
              <View style={styles.toolBtn}>
                <Text style={styles.toolBtnText}>Aa</Text>
              </View>
              <View style={styles.toolBtn}>
                <Ionicons name="happy-outline" size={18} color="#fff" />
              </View>
              <View style={styles.toolBtn}>
                <Ionicons name="sparkles-outline" size={18} color="#fff" />
              </View>
              <View style={styles.toolBtn}>
                <Ionicons name="images-outline" size={18} color="#fff" />
              </View>
              <View style={styles.toolBtn}>
                <Ionicons name="mic-outline" size={18} color="#fff" />
              </View>
              <View style={styles.toolBtn}>
                <Ionicons name="cut-outline" size={18} color="#fff" />
              </View>
              <View style={styles.toolBtn}>
                <Ionicons name="ellipsis-horizontal" size={18} color="#fff" />
              </View>
            </View>

            <TouchableOpacity style={styles.editCoverBtn}>
              <Text style={styles.editCoverText}>Chỉnh sửa ảnh bìa</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.captionSection}>
          <TextInput
            ref={captionInputRef}
            style={styles.captionInput}
            placeholder="Viết phụ đề và thêm hashtag..."
            placeholderTextColor="#999"
            value={caption}
            onChangeText={setCaption}
            multiline
            maxLength={2200}
          />
        </View>

        <View style={styles.chipsRow}>
          <TouchableOpacity style={styles.chip} onPress={handleHashtagPress}>
            <Text style={styles.chipIconText}>#</Text>
            <Text style={styles.chipText}>Hashtag</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.chip}>
            <Ionicons
              name="reorder-three-outline"
              size={16}
              color="#444"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.chipText}>Cuộc thăm dò ý kiến</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.chip}>
            <Ionicons name="search-outline" size={16} color="#444" style={{ marginRight: 6 }} />
            <Text style={styles.chipText}>Gợi ý</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.chip}>
            <Ionicons name="pencil-outline" size={16} color="#444" style={{ marginRight: 6 }} />
            <Text style={styles.chipText}>Viết lại</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.rowPressable}>
          <View style={styles.rowLeft}>
            <Ionicons name="person-outline" size={24} color="#000" style={{ marginRight: 12 }} />
            <Text style={styles.rowMainText}>Gắn thẻ người khác</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#999" />
        </TouchableOpacity>

        {pickedLocation ? (
          <>
            <View style={styles.locationSelectedWrapper}>
              <View style={styles.locationSelectedIconWrap}>
                <Ionicons name="location-sharp" size={18} color="#4264ff" />
              </View>

              <View style={styles.locationSelectedTextWrap}>
                <Text style={styles.locationSelectedName} numberOfLines={1}>
                  {pickedLocation.name}
                </Text>

                <Text style={styles.locationSelectedDetail} numberOfLines={2}>
                  {renderLocationSecondaryLine()}
                </Text>
              </View>

              <TouchableOpacity style={styles.locationRemoveBtn} onPress={handleRemoveLocation}>
                <Ionicons name="close" size={20} color="#999" />
              </TouchableOpacity>
            </View>

            <Text style={styles.locationInfoNote}>
              Những người mà bạn chia sẻ nội dung này có thể nhìn thấy vị trí bạn gắn thẻ và xem nội
              dung này trên bản đồ.
            </Text>
          </>
        ) : (
          <TouchableOpacity style={styles.rowPressable} onPress={() => setShowLocationSearch(true)}>
            <View style={styles.rowLeft}>
              <Ionicons
                name="location-outline"
                size={24}
                color="#000"
                style={{ marginRight: 12 }}
              />
              <Text style={styles.rowMainText}>Thêm vị trí</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#999" />
          </TouchableOpacity>
        )}

        <View style={[styles.rowPressable, { borderBottomWidth: 0 }]}>
          <View style={[styles.rowLeft, { flex: 1 }]}>
            <Ionicons name="copy-outline" size={24} color="#000" style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.rowMainText}>Thêm nhãn AI</Text>
              <Text style={styles.rowSubText}>
                Chúng tôi yêu cầu bạn gắn nhãn cho một số nội dung nhất định tạo bằng AI.
              </Text>
            </View>
          </View>

          <Switch
            value={aiTagEnabled}
            onValueChange={setAiTagEnabled}
            trackColor={{ false: '#d1d1d1', true: '#4264ff' }}
            thumbColor={'#fff'}
          />
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <View style={styles.bottomRow}>
          <TouchableOpacity
            style={[styles.saveDraftBtn, isUploading && styles.btnDisabled]}
            disabled={isUploading}
            onPress={() => {
              console.log('Lưu bản nháp');
            }}
          >
            <Text style={styles.saveDraftText}>Lưu bản nháp</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.shareBtn, isUploading && styles.btnDisabled]}
            onPress={handleShare}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.shareBtnText}>Đang tải...</Text>
              </>
            ) : (
              <Text style={styles.shareBtnText}>Chia sẻ</Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.learnMoreTouch}
          onPress={() => {
            console.log('Tìm hiểu thêm về Reels');
          }}
        >
          <Text style={styles.learnMoreText}>Tìm hiểu thêm về Reels.</Text>
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
    alignItems: 'center',
    paddingVertical: 16,
  },
  previewContainer: {
    width: PREVIEW_WIDTH,
    height: PREVIEW_HEIGHT,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000',
    position: 'relative',
  },
  previewMedia: {
    width: '100%',
    height: '100%',
  },

  editTools: {
    position: 'absolute',
    top: 8,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  toolBtn: {
    minWidth: 28,
    minHeight: 28,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  editCoverBtn: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
  },
  editCoverText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  captionSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
  },
  captionInput: {
    fontSize: 16,
    color: '#000',
    minHeight: 60,
    textAlignVertical: 'top',
  },

  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F2F7',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e2e4',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  chipIconText: {
    fontSize: 12,
    color: '#444',
    fontWeight: '600',
    marginRight: 6,
  },
  chipText: {
    fontSize: 12,
    color: '#444',
    fontWeight: '500',
  },

  rowPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  rowMainText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '400',
  },
  rowSubText: {
    fontSize: 14,
    color: '#6b6b6b',
    lineHeight: 20,
    marginTop: 4,
  },

  // --- block vị trí đã chọn (màu xanh dương) ---
  locationSelectedWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  locationSelectedIconWrap: {
    marginRight: 12,
    marginTop: 2,
  },
  locationSelectedTextWrap: {
    flex: 1,
  },
  locationSelectedName: {
    color: '#4264ff',
    fontSize: 16,
    fontWeight: '600',
  },
  locationSelectedDetail: {
    color: '#6b6b6b',
    fontSize: 14,
    lineHeight: 20,
  },
  locationRemoveBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 4,
  },
  locationInfoNote: {
    color: '#6b6b6b',
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },

  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  bottomRow: {
    flexDirection: 'row',
    gap: 12,
  },
  saveDraftBtn: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveDraftText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  shareBtn: {
    flex: 1,
    backgroundColor: '#4264ff',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  shareBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  learnMoreTouch: {
    marginTop: 12,
    alignItems: 'center',
  },
  learnMoreText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4264ff',
  },
});
