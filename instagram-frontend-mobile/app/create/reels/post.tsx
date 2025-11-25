import React, { useRef, useState, useEffect } from 'react';
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
  Keyboard,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useUpload } from '../../../context/UploadContext';
import { useAuth } from '../../../hooks/useAuth';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LocationSearchScreen } from '../../../components/create/reels/LocationSearchScreen';
import CaptionInputScreen from '../../../components/common/CaptionInputScreen';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
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
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [showCaptionInput, setShowCaptionInput] = useState(false);
  const [showLocationSearch, setShowLocationSearch] = useState(false);
  const [pickedLocation, setPickedLocation] = useState<PickedLocation>(null);

  const [mentionSuggestions, setMentionSuggestions] = useState<MentionUserResponse[]>([]);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionSearchQuery, setMentionSearchQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [isSearchingMentions, setIsSearchingMentions] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<any>({});
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const insets = useSafeAreaInsets();
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

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', e => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  // Recalculate position when keyboard changes or dropdown visibility changes
  useEffect(() => {
    if (showMentionDropdown) {
      measureInputPosition();
    }
  }, [keyboardHeight, showMentionDropdown, mentionSuggestions]);

  useEffect(() => {
    console.log('[Post] Mention effect triggered - showMentionDropdown:', showMentionDropdown, 'query:', mentionSearchQuery);

    const searchMentions = async () => {
      console.log('[Post] Starting mention search with query:', mentionSearchQuery);
      setIsSearchingMentions(true);
      try {
        const result = await mentionService.searchUsers(mentionSearchQuery, 0, 10);
        console.log('[Post] Search result:', result);
        setMentionSuggestions(result.content || []);
        // Remeasure after results load as it might affect rendering
        setTimeout(measureInputPosition, 100);
      } catch (error) {
        console.error('[Post] Error searching mentions:', error);
        setMentionSuggestions([]);
      } finally {
        setIsSearchingMentions(false);
      }
    };

    // Only search if dropdown is visible AND query has at least 1 character
    if (showMentionDropdown && mentionSearchQuery.length > 0) {
      const timeoutId = setTimeout(searchMentions, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setMentionSuggestions([]);
      setIsSearchingMentions(false);
    }
  }, [mentionSearchQuery, showMentionDropdown]);

  const handleCaptionChange = (text: string) => {
    console.log('[Post] Caption changed:', text, 'cursorPos:', cursorPosition);
    setCaption(text);

    // Always use text.length as cursor position when typing (state lags behind)
    const effectiveCursorPos = text.length;
    const textBeforeCursor = text.substring(0, effectiveCursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    console.log('[Post] effectiveCursorPos:', effectiveCursorPos, 'textBeforeCursor:', textBeforeCursor, 'lastAtIndex:', lastAtIndex);

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      const hasSpaceOrNewline = /[\s\n]/.test(textAfterAt);

      console.log('[Post] Found @ at index:', lastAtIndex, 'textAfterAt:', textAfterAt, 'hasSpaceOrNewline:', hasSpaceOrNewline);

      // Only show dropdown if there's at least 1 character after @ AND no space/newline
      if (!hasSpaceOrNewline && textAfterAt.length > 0) {
        console.log('[Post] Opening dropdown with query:', textAfterAt);
        setMentionSearchQuery(textAfterAt);
        setShowMentionDropdown(true);
        return;
      }
    }

    console.log('[Post] Closing dropdown');
    setShowMentionDropdown(false);
    setMentionSearchQuery('');
  };

  const handleSelectionChange = (event: any) => {
    setCursorPosition(event.nativeEvent.selection.end);
  };

  const handleSelectMention = (user: MentionUserResponse) => {
    const textBeforeCursor = caption.substring(0, cursorPosition);
    const textAfterCursor = caption.substring(cursorPosition);

    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const before = caption.substring(0, lastAtIndex);
      const newCaption = before + '@' + user.username + ' ' + textAfterCursor;

      setCaption(newCaption);
      setShowMentionDropdown(false);
      setMentionSearchQuery('');

      const newCursorPos = lastAtIndex + user.username.length + 2;
      setCursorPosition(newCursorPos);

      setTimeout(() => {
        captionInputRef.current?.focus();
      }, 100);
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/create/reels');
    }
  };

  const handleCaptionSave = (newCaption: string, extractedHashtags: string[]) => {
    setCaption(newCaption);
    setHashtags(extractedHashtags);
    setShowCaptionInput(false);
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
        mediaUris: [mediaUri],
        mediaType: mediaType,
        caption: caption,
        hashtags: hashtags,
        location: pickedLocation?.name,
        userId: user.id,
      });
    }, 100);
  };

  const handleSelectLocation = (loc: { name: string; address?: string; distance?: string }) => {
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

  if (showLocationSearch) {
    return (
      <LocationSearchScreen
        onClose={() => setShowLocationSearch(false)}
        onSelectLocation={handleSelectLocation}
      />
    );
  }

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
                nativeControls={false}
              />
            ) : (
              <Image source={{ uri: mediaUri }} style={styles.previewMedia} resizeMode="cover" />
            )}
          </View>
        </View>

        <TouchableOpacity
          style={styles.captionSection}
          onPress={() => setShowCaptionInput(true)}
          activeOpacity={0.7}
        >
          <Text
            style={[styles.captionText, !caption && styles.captionPlaceholder]}
            numberOfLines={3}
          >
            {caption || 'Viết phụ đề và thêm hashtag...'}
          </Text>
          {hashtags.length > 0 && (
            <View style={styles.hashtagsPreview}>
              {hashtags.slice(0, 3).map((tag, index) => (
                <View key={index} style={styles.hashtagChip}>
                  <Text style={styles.hashtagChipText}>#{tag}</Text>
                </View>
              ))}
              {hashtags.length > 3 && (
                <Text style={styles.hashtagMoreText}>+{hashtags.length - 3} nữa</Text>
              )}
            </View>
          )}
        </TouchableOpacity>

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

      {/* Mention Dropdown - Positioned absolutely over content */}
      <MentionDropdown
        visible={showMentionDropdown}
        suggestions={mentionSuggestions}
        isSearching={isSearchingMentions}
        searchQuery={mentionSearchQuery}
        onSelectMention={handleSelectMention}
        dropdownStyle={dropdownStyle}
      />

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

      <CaptionInputScreen
        visible={showCaptionInput}
        initialCaption={caption}
        onSave={handleCaptionSave}
        onClose={() => setShowCaptionInput(false)}
      />
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
    minHeight: 80,
  },
  captionText: {
    fontSize: 16,
    color: '#000',
    lineHeight: 22,
  },
  captionPlaceholder: {
    color: '#999',
  },
  hashtagsPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 6,
    alignItems: 'center',
  },
  hashtagChip: {
    backgroundColor: '#E8F0FE',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  hashtagChipText: {
    fontSize: 13,
    color: '#1976D2',
    fontWeight: '500',
  },
  hashtagMoreText: {
    fontSize: 13,
    color: '#666',
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
    flex: 1,
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
  // Bottom bar
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
