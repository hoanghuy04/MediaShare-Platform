// components/messages/MessageInput.tsx
import React,
{
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
  Alert,
  Keyboard,
  ScrollView,
  FlatList,
  Animated,
  Dimensions,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import { useTheme } from '../../hooks/useTheme';
import {
  COLORS,
  SIZES,
  EMOJI,
  EMOJI_CATEGORIES_ORDER,
  EMOJI_DEFAULTS,
} from '../../utils/constants';
import { MessageType } from '../../types/enum.type';
import { mediaService } from '../../services/media';

type EmojiCategory = (typeof EMOJI_CATEGORIES_ORDER)[number];

export interface MessageInputProps {
  onSend: (message: string) => void;
  onSendToAI?: (message: string) => void;
  onSendMedia?: (type: MessageType, mediaFileId: string) => void;
  onTyping?: () => void;
  onStopTyping?: () => void;
  placeholder?: string;
  themeColor?: string; // compat, không dùng trực tiếp

  /** new: cho phép parent điều khiển trạng thái panel emoji */
  isEmojiVisible?: boolean;
  onEmojiVisibilityChange?: (visible: boolean) => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;

/* ---------------- Emoji Panel ---------------- */
const EmojiPanel: React.FC<{
  visible: boolean;
  onPick: (emoji: string) => void;
}> = ({ visible, onPick }) => {
  const [active, setActive] = useState<EmojiCategory>('smileys');
  const [recents, setRecents] = useState<string[]>([]);
  const { theme } = useTheme();

  const COLS = EMOJI_DEFAULTS.gridColumns;
  const GRID_H_PAD = SIZES.md;
  const GAP = 8;

  const heightAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(heightAnim, {
      toValue: visible ? EMOJI_DEFAULTS.panelHeight : 0,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, [visible, heightAnim]);

  const itemSize = useMemo(() => {
    const usable = SCREEN_WIDTH - GRID_H_PAD * 2;
    const totalGaps = (COLS - 1) * GAP;
    return Math.floor((usable - totalGaps) / COLS);
  }, [COLS, GRID_H_PAD, GAP]);

  const categories: EmojiCategory[] = useMemo(
    () =>
      recents.length
        ? (['smileys'] as EmojiCategory[]).concat(
            EMOJI_CATEGORIES_ORDER.slice(1),
          )
        : EMOJI_CATEGORIES_ORDER,
    [recents.length],
  );

  const list = useMemo(() => {
    if (active === 'smileys' && recents.length) return recents;
    return EMOJI[active] || [];
  }, [active, recents]);

  const handlePick = (e: string) => {
    onPick(e);
  };

  return (
    <Animated.View
      style={[
        styles.emojiPanel,
        {
          backgroundColor: theme.colors.surface,
          height: heightAnim,
        },
      ]}
    >
      <View style={styles.emojiHeader}>
        <Text
          style={[styles.emojiTitle, { color: theme.colors.text }]}
          allowFontScaling={false}
        >
          Chọn emoji
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.catRow}
      >
        {categories.map(cat => {
          const selected = cat === active;
          return (
            <TouchableOpacity
              key={`cat-${cat}`}
              onPress={() => setActive(cat)}
              style={[
                styles.catPill,
                {
                  backgroundColor: selected
                    ? theme.colors.primary
                    : theme.colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.catText,
                  {
                    color: selected
                      ? COLORS.light.background
                      : theme.colors.text,
                  },
                ]}
                allowFontScaling={false}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <FlatList
        data={list}
        keyExtractor={(_item, index) => `emoji-${active}-${index}`}
        numColumns={COLS}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: GRID_H_PAD,
          paddingBottom: SIZES.md,
        }}
        columnWrapperStyle={{
          justifyContent: 'space-between',
          marginBottom: GAP,
        }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={{
              width: itemSize,
              height: itemSize,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: SIZES.radiusMd,
            }}
            activeOpacity={0.7}
            onPress={() => handlePick(item)}
          >
            <Text
              style={{
                fontSize: EMOJI_DEFAULTS.emojiSize,
                textAlign: 'center',
              }}
              allowFontScaling={EMOJI_DEFAULTS.allowFontScaling}
            >
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />
    </Animated.View>
  );
};

/* ---------------- MessageInput ---------------- */
export const MessageInput: React.FC<MessageInputProps> = ({
  onSend,
  onSendToAI,
  onSendMedia,
  onTyping,
  onStopTyping,
  placeholder = 'Nhắn tin…',
  isEmojiVisible,
  onEmojiVisibilityChange,
}) => {
  const { theme } = useTheme();
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const recordingRef = useRef<Audio.Recording | null>(null);

  const [showAiSuggest, setShowAiSuggest] = useState(false);
  const [routeToAI, setRouteToAI] = useState(false);

  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasText = message.trim().length > 0;

  const buttonGradientColors = useMemo(
    () =>
      [
        theme.chat.gradientHigh,
        theme.chat.gradientMedium,
        theme.chat.gradientLow,
      ] as const,
    [theme.chat.gradientHigh, theme.chat.gradientMedium, theme.chat.gradientLow]
  );

  // ---- emoji visible: controlled / uncontrolled ----
  const [innerEmojiVisible, setInnerEmojiVisible] = useState(false);
  const controlled = typeof isEmojiVisible === 'boolean';

  const showEmoji = controlled ? !!isEmojiVisible : innerEmojiVisible;
  const setShowEmoji = (v: boolean) => {
    if (!controlled) setInnerEmojiVisible(v);
    onEmojiVisibilityChange?.(v);
  };

  // fake recorder timer
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    if (isRecording) {
      timer = setInterval(() => setRecordSeconds(p => p + 1), 1000);
    } else {
      setRecordSeconds(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRecording]);

  useEffect(() => {
    return () => {
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
        recordingRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  const stopTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    onStopTyping?.();
  }, [onStopTyping]);

  const scheduleStopTyping = useCallback(() => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(stopTyping, 1200);
  }, [stopTyping]);

  const updateMentionState = (text: string) => {
    const tokens = text.split(/\s+/);
    const last = tokens[tokens.length - 1] || '';
    const hasAt = last.startsWith('@');

    setShowAiSuggest(hasAt);
    const willRouteToAI =
      /(^|\s)@ai-assistant\b/i.test(text) ||
      (hasAt && last.toLowerCase().startsWith('@ai'));
    setRouteToAI(willRouteToAI);
  };

  const handleTextChange = (text: string) => {
    setMessage(text);
    if (text.trim()) onTyping?.();
    else onStopTyping?.();
    updateMentionState(text);
    scheduleStopTyping();
  };

  const handleSelectAiAssistant = () => {
    setMessage(prev => {
      const tokens = prev.split(/\s+/);
      if (!tokens.length) return '@ai-assistant ';
      const last = tokens[tokens.length - 1] || '';
      if (last.startsWith('@')) {
        tokens[tokens.length - 1] = '@ai-assistant';
      } else {
        tokens.push('@ai-assistant');
      }
      return tokens.join(' ') + ' ';
    });
    setRouteToAI(true);
    setShowAiSuggest(false);
    onTyping?.();
    scheduleStopTyping();
  };

  const startRecording = useCallback(async () => {
    if (!onSendMedia) {
      Alert.alert('Thông báo', 'Chức năng gửi voice chưa được kích hoạt.');
      return;
    }
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Quyền truy cập', 'Vui lòng cho phép sử dụng micro.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setRecordSeconds(0);
      setIsRecording(true);
    } catch (_error) {
      Alert.alert('Lỗi', 'Không thể bắt đầu ghi âm. Vui lòng thử lại.');
      recordingRef.current = null;
      setIsRecording(false);
    }
  }, [onSendMedia]);

  const stopRecordingAndSend = useCallback(async () => {
    const currentRecording = recordingRef.current;
    if (!currentRecording) return;
    try {
      await currentRecording.stopAndUnloadAsync();
      const uri = currentRecording.getURI();
      if (uri && onSendMedia) {
        onSendMedia(MessageType.AUDIO, uri);
      }
    } catch (_error) {
      Alert.alert('Lỗi', 'Không thể gửi tin nhắn thoại. Vui lòng thử lại.');
    } finally {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
        });
      } catch (error) {
        // ignore audio mode reset errors
      }
      recordingRef.current = null;
      setIsRecording(false);
      setRecordSeconds(0);
    }
  }, [onSendMedia]);

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed) return;

    const willSendToAI =
      !!onSendToAI &&
      (routeToAI ||
        /^@ai-assistant\b/i.test(trimmed) ||
        /(^|\s)@ai-assistant\b/i.test(trimmed));

    if (willSendToAI) {
      const clean = trimmed.replace(/^@ai-assistant\b\s*/i, '').trim() || trimmed;
      onSendToAI?.(clean);
    } else {
      onSend(trimmed);
    }

    setMessage('');
    setRouteToAI(false);
    setShowAiSuggest(false);
    stopTyping();
    setShowEmoji(false);
  };

  const handleOpenCamera = useCallback(async () => {
    if (!onSendMedia) {
      Alert.alert('Thông báo', 'Chức năng gửi media chưa được kích hoạt.');
      return;
    }
    try {
      const photo = await mediaService.takePhoto();
      if (photo?.uri) {
        onSendMedia(MessageType.IMAGE, photo.uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Lỗi', 'Không thể mở camera. Vui lòng thử lại.');
    }
  }, [onSendMedia]);

  const handlePickImage = async () => {
    if (!onSendMedia) {
      Alert.alert('Thông báo', 'Chức năng gửi media chưa được kích hoạt.');
      return;
    }

    // Show selection: Image or Video
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Hủy', 'Chọn ảnh', 'Chọn video'],
          cancelButtonIndex: 0,
        },
        buttonIndex => {
          if (buttonIndex === 1) {
            pickMedia('image');
          } else if (buttonIndex === 2) {
            pickMedia('video');
          }
        }
      );
    } else {
      // Android: Show alert dialog
      Alert.alert(
        'Chọn loại media',
        'Bạn muốn gửi ảnh hay video?',
        [
          { text: 'Hủy', style: 'cancel' },
          { text: 'Ảnh', onPress: () => pickMedia('image') },
          { text: 'Video', onPress: () => pickMedia('video') },
        ],
        { cancelable: true }
      );
    }
  };

  const pickMedia = async (type: 'image' | 'video') => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Quyền truy cập',
          'Ứng dụng cần quyền truy cập thư viện ảnh để chọn media.'
        );
        return;
      }

      // Launch picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: type === 'image' ? ImagePicker.MediaTypeOptions.Images : ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        quality: type === 'image' ? 0.8 : 1,
        videoMaxDuration: 60, // 60 seconds max for videos
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        // Parent will handle upload and optimistic UI
        onSendMedia?.(
          type === 'image' ? MessageType.IMAGE : MessageType.VIDEO,
          asset.uri
        );
      }
    } catch (error) {
      console.error('Error picking media:', error);
      Alert.alert('Lỗi', 'Không thể chọn media. Vui lòng thử lại.');
    }
  };

  const openEmoji = () => {
    Keyboard.dismiss();
    setShowEmoji(true);
  };

  const onPickEmoji = (e: string) => {
    setMessage(prev => `${prev}${e}`);
    onTyping?.();
    updateMentionState(message + e);
    scheduleStopTyping();
  };

  const handleSearchPress = () => {
    // TODO: open message search screen
  };

  return (
    <View style={styles.wrapper}>
      {/* Dropdown @ai-assistant */}
      {showAiSuggest && (
        <View
          style={[
            styles.mentionContainer,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <TouchableOpacity style={styles.mentionRow} onPress={handleSelectAiAssistant}>
            <View
              style={[
                styles.mentionAvatar,
                { backgroundColor: theme.colors.overlay },
              ]}
            >
              <Ionicons
                name="sparkles-outline"
                size={SIZES.iconSm}
                color={theme.colors.primary}
              />
            </View>
            <View style={styles.mentionTextCol}>
              <Text
                style={[styles.mentionTitle, { color: theme.colors.text }]}
                numberOfLines={1}
              >
                ai-assistant
              </Text>
              <Text
                style={[
                  styles.mentionSubtitle,
                  { color: theme.colors.textSecondary },
                ]}
                numberOfLines={1}
              >
                Hỏi trợ lý AI trong cuộc trò chuyện này
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Hàng input */}
      <View style={styles.inputRow}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={hasText ? handleSearchPress : handleOpenCamera}
        >
          <LinearGradient
            colors={buttonGradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.mainCircleButton}
          >
            <Ionicons
              name={hasText ? 'search' : 'camera'}
              size={24}
              color={theme.colors.white}
            />
          </LinearGradient>
        </TouchableOpacity>

        <View
          style={[
            styles.inputContainer,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <TextInput
            value={message}
            onChangeText={handleTextChange}
            placeholder={placeholder}
            placeholderTextColor={theme.colors.textSecondary}
            style={[styles.input, { color: theme.colors.text }]}
            multiline
            allowFontScaling={false}
            onFocus={() => {
              // nếu đang mở emoji panel, bấm vào input -> đóng panel
              if (showEmoji) {
                setShowEmoji(false);
              }
            }}
          />

          {!hasText && (
            <View style={styles.inputIconsRow}>
              <TouchableOpacity
                style={styles.inlineIconButton}
                onPress={isRecording ? stopRecordingAndSend : startRecording}
              >
                <Ionicons
                  name={isRecording ? 'stop-circle' : 'mic-outline'}
                  size={20}
                  color={
                    isRecording ? theme.colors.danger : theme.colors.textSecondary
                  }
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.inlineIconButton}
                onPress={handlePickImage}
              >
                <Ionicons
                  name="image-outline"
                  size={20}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.inlineIconButton}
                onPress={openEmoji}
              >
                <Ionicons
                  name="happy-outline"
                  size={20}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {hasText && (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleSend}
            style={{ marginLeft: SIZES.sm }}
          >
            <LinearGradient
              colors={buttonGradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.mainCircleButton}
            >
              <Ionicons
                name="send"
                size={22}
                color={theme.colors.white}
              />
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>

      {isRecording && (
        <View
          style={[
            styles.recordingBadge,
            { backgroundColor: theme.chat.tint },
          ]}
        >
          <Ionicons name="pulse" size={12} color={theme.colors.white} />
          <Text style={styles.recordingText} allowFontScaling={false}>
            {recordSeconds}s
          </Text>
        </View>
      )}

      {/* Emoji panel dưới input */}
      <EmojiPanel visible={showEmoji} onPick={onPickEmoji} />
    </View>
  );
};

/* ---------------- Styles ---------------- */
const CIRCLE = 44;

const styles = StyleSheet.create({
  wrapper: {
    paddingVertical: SIZES.sm,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.md,
  },

  mainCircleButton: {
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  inputContainer: {
    flex: 1,
    borderRadius: SIZES.radiusFull,
    paddingHorizontal: SIZES.sm,
    minHeight: CIRCLE,
    marginHorizontal: SIZES.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: SIZES.fontMd,
    maxHeight: 120,
    paddingVertical: 0,
  },
  inputIconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: SIZES.xs,
  },
  inlineIconButton: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginLeft: 4,
  },

  recordingBadge: {
    marginTop: 4,
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  recordingText: { color: '#fff', fontSize: 12, marginLeft: 4 },

  emojiPanel: {
    width: '100%',
    borderTopLeftRadius: SIZES.radiusLg,
    borderTopRightRadius: SIZES.radiusLg,
    overflow: 'hidden',
  },
  emojiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.sm + 4,
    paddingVertical: SIZES.sm,
  },
  emojiTitle: {
    fontSize: SIZES.fontSm + 2,
    fontWeight: '700',
  },
  catRow: {
    paddingHorizontal: SIZES.sm + 4,
    paddingBottom: SIZES.sm,
    gap: SIZES.xs,
    height: 36,
    marginBottom: 12,
  },
  catPill: {
    paddingHorizontal: SIZES.md,
    paddingVertical: 6,
    borderRadius: SIZES.radiusFull,
    marginRight: SIZES.xs,
  },
  catText: {
    fontSize: SIZES.fontSm,
    fontWeight: '600',
  },

  mentionContainer: {
    width: '100%',
    borderRadius: SIZES.radiusLg,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: SIZES.xs,
  },
  mentionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
  },
  mentionAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.sm,
  },
  mentionTextCol: { flex: 1 },
  mentionTitle: { fontSize: 14, fontWeight: '600' },
  mentionSubtitle: { fontSize: 12 },
});

export default MessageInput;
