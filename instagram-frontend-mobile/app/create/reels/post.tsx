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
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useUpload } from '@/context/UploadContext';
import { useAuth } from '@/context/AuthContext';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LocationSearchScreen } from '@/components/create/reels/LocationSearchScreen';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PREVIEW_WIDTH = SCREEN_WIDTH * 0.4;
const PREVIEW_HEIGHT = PREVIEW_WIDTH * 1.78;

type PickedLocation = {
  name: string;
  address?: string;
  distance?: string;
} | null;

export default function ReelPostScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();

  const { startUpload } = useUpload();

  const rawUri = params.mediaUri as string;
  const mediaUri = rawUri ? decodeURIComponent(rawUri) : '';
  const mediaType = (params.mediaType as 'photo' | 'video') || 'video';

  const [caption, setCaption] = useState('');
  const [showLocationSearch, setShowLocationSearch] = useState(false);
  const [pickedLocation, setPickedLocation] = useState<PickedLocation>(null);

  const isSubmittingRef = useRef(false);

  const scrollRef = useRef<ScrollView | null>(null);
  const captionInputRef = useRef<TextInput | null>(null);

  const player = useVideoPlayer(mediaType === 'video' && mediaUri ? mediaUri : null, player => {
    if (mediaType === 'video') {
      player.loop = true;
      player.play();
      player.muted = true;
    }
  });

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/create/reels');
    }
  };

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

  const handleShare = () => {
    if (isSubmittingRef.current) return;

    if (!user || !user.id) {
      Alert.alert('Lỗi', 'Vui lòng đăng nhập để chia sẻ Reel.');
      return;
    }

    isSubmittingRef.current = true;

    router.replace('/(tabs)/feed');

    setTimeout(() => {
      startUpload({
        mediaUri: mediaUri,
        mediaType: mediaType,
        caption: caption,
        location: pickedLocation?.name,
        userId: user.id,
      });
    }, 100);
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

  if (!mediaUri) {
    return (
      <View style={styles.container}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.headerBtn}>
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
              <VideoView
                style={styles.previewMedia}
                player={player}
                contentFit="cover"
                nativeControls={false}
              />
            ) : (
              <Image source={{ uri: mediaUri }} style={styles.previewMedia} resizeMode="cover" />
            )}
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
      </ScrollView>

      <View style={styles.bottomBar}>
        <View style={styles.bottomRow}>
          <TouchableOpacity style={styles.saveDraftBtn} onPress={() => console.log('Lưu bản nháp')}>
            <Text style={styles.saveDraftText}>Lưu bản nháp</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.7}>
            <Text style={styles.shareBtnText}>Chia sẻ</Text>
          </TouchableOpacity>
        </View>
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
});
