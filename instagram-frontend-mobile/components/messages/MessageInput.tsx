// components/messages/MessageInput.tsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
  Platform,
  Alert,
  Modal,
  Keyboard,
  ScrollView,
  FlatList,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import {
  COLORS,
  SIZES,
  EMOJI,
  EMOJI_CATEGORIES_ORDER,
  EMOJI_DEFAULTS,
  EMOJI_RECENTS_MAX,
} from '../../utils/constants';

type EmojiCategory = (typeof EMOJI_CATEGORIES_ORDER)[number];

export interface MessageInputProps {
  onSend: (message: string) => void;
  onTyping?: () => void;
  onStopTyping?: () => void;
  placeholder?: string;
  themeColor?: string;
}

/* --------------------------------- */
/* Emoji Panel (FlatList grid đều)   */
/* --------------------------------- */
const EmojiPanel: React.FC<{
  visible: boolean;
  onClose: () => void;
  onPick: (emoji: string) => void;
}> = ({ visible, onClose, onPick }) => {
  const [active, setActive] = useState<EmojiCategory>('smileys');
  const [recents, setRecents] = useState<string[]>([]);
  const [panelWidth, setPanelWidth] = useState<number>(0);
  const { theme } = useTheme();

  // cấu hình grid
  const COLS = EMOJI_DEFAULTS.gridColumns;    // ví dụ: 8
  const GRID_H_PAD = SIZES.md;                 // padding ngang container
  const GAP = 8;                               // khoảng cách giữa các cột

  const itemSize = useMemo(() => {
    if (!panelWidth) return 40;
    const usable = panelWidth - GRID_H_PAD * 2;
    const totalGaps = (COLS - 1) * GAP;
    return Math.floor((usable - totalGaps) / COLS);
  }, [panelWidth]);

  const categories: EmojiCategory[] = useMemo(
    () =>
      recents.length
        ? (['smileys'] as EmojiCategory[]).concat(EMOJI_CATEGORIES_ORDER.slice(1))
        : EMOJI_CATEGORIES_ORDER,
    [recents.length]
  );

  const list = useMemo(() => {
    if (active === 'smileys' && recents.length) return recents;
    return EMOJI[active] || [];
  }, [active, recents]);

  const handlePick = (e: string) => {
    setRecents(prev => [e, ...prev.filter(x => x !== e)].slice(0, EMOJI_RECENTS_MAX));
    onPick(e);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.emojiOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject as StyleProp<ViewStyle>} onPress={onClose} />
        <View
          style={[styles.emojiPanel, { backgroundColor: theme.colors.surface }]}
          onLayout={e => setPanelWidth(e.nativeEvent.layout.width)}
        >
          {/* Header */}
          <View style={styles.emojiHeader}>
            <Text style={[styles.emojiTitle, { color: theme.colors.text }]} allowFontScaling={false}>
              Chọn emoji
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={SIZES.iconSm} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
            {categories.map(cat => {
              const selected = cat === active;
              return (
                <TouchableOpacity
                  key={`cat-${cat}`}
                  onPress={() => setActive(cat)}
                  style={[
                    styles.catPill,
                    { backgroundColor: selected ? theme.colors.primary : theme.colors.border },
                  ]}
                >
                  <Text
                    style={[
                      styles.catText,
                      { color: selected ? COLORS.light.background : theme.colors.text },
                    ]}
                    allowFontScaling={false}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Grid (đều hai bên) */}
          <FlatList
            data={list}
            keyExtractor={(_item, index) => `emoji-${active}-${index}`} // dùng index để tránh trùng key
            numColumns={COLS}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: GRID_H_PAD, paddingBottom: SIZES.md }}
            columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: GAP }}
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
                  style={{ fontSize: EMOJI_DEFAULTS.emojiSize, textAlign: 'center' }}
                  allowFontScaling={EMOJI_DEFAULTS.allowFontScaling}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );
};

/* --------------------------------- */
/* MessageInput                       */
/* --------------------------------- */
export const MessageInput: React.FC<MessageInputProps> = ({
  onSend,
  onTyping,
  onStopTyping,
  placeholder = 'Nhắn tin',
  themeColor,
}) => {
  const { theme } = useTheme();
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [showEmoji, setShowEmoji] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // demo recorder timer
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

  // cleanup typing debounce
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

  const handleTextChange = (text: string) => {
    setMessage(text);
    if (text.trim()) onTyping?.();
    else onStopTyping?.();
    scheduleStopTyping();
  };

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setMessage('');
    stopTyping();
    setShowEmoji(false);
  };

  const handleAttachmentPress = () => {
    const options = ['Ảnh/Video', 'Sticker', 'File', 'Hủy'];
    if (Platform.OS === 'ios') {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const ActionSheet = require('react-native').ActionSheetIOS;
      ActionSheet.showActionSheetWithOptions(
        { options, cancelButtonIndex: options.length - 1, title: 'Chia sẻ' },
        () => {}
      );
    } else {
      Alert.alert('Chia sẻ', 'Chọn loại nội dung bạn muốn gửi');
    }
  };

  const toggleRecording = () => setIsRecording(p => !p);

  const openEmoji = () => {
    Keyboard.dismiss();
    setShowEmoji(true);
  };

  const onPickEmoji = (e: string) => {
    setMessage(prev => `${prev}${e}`);
    onTyping?.();
    scheduleStopTyping();
  };

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        style={[styles.attachButton, { backgroundColor: theme.chat.fabBg }]}
        onPress={handleAttachmentPress}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={SIZES.iconMd} color={theme.colors.text} />
      </TouchableOpacity>

      <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface }]}>
        <TextInput
          value={message}
          onChangeText={handleTextChange}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textSecondary}
          style={[styles.input, { color: theme.colors.text }]}
          multiline
          allowFontScaling={false}
        />
        <View style={styles.inputActions}>
          <TouchableOpacity style={styles.iconButton} onPress={openEmoji}>
            <Ionicons name="happy-outline" size={SIZES.iconSm} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={toggleRecording}>
            <Ionicons
              name={isRecording ? 'stop-circle' : 'mic-outline'}
              size={SIZES.iconSm}
              color={isRecording ? theme.colors.danger : theme.colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        onPress={handleSend}
        disabled={!message.trim()}
        style={[
          styles.sendButton,
          {
            backgroundColor: message.trim()
              ? themeColor || theme.chat.bubbleOut
              : theme.colors.border,
          },
        ]}
      >
        <Ionicons
          name="send"
          size={20}
          color={message.trim() ? theme.chat.bubbleText : theme.colors.textSecondary}
        />
      </TouchableOpacity>

      {isRecording && (
        <View style={styles.recordingBadge}>
          <Ionicons name="pulse" size={12} color="#fff" />
          <Text style={styles.recordingText} allowFontScaling={false}>
            {recordSeconds}s
          </Text>
        </View>
      )}

      {/* Emoji modal */}
      <EmojiPanel visible={showEmoji} onClose={() => setShowEmoji(false)} onPick={onPickEmoji} />
    </View>
  );
};

/* --------------------------------- */
/* Styles                             */
/* --------------------------------- */
const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: SIZES.md,
    gap: SIZES.sm,
  },
  attachButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputContainer: {
    flex: 1,
    borderRadius: SIZES.radiusLg,
    paddingHorizontal: SIZES.sm + 6,
    paddingVertical: SIZES.sm - 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: SIZES.fontMd,
    maxHeight: 120,
    paddingTop: 0,
    paddingBottom: 0,
  },
  inputActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: SIZES.xs + 2,
  },
  iconButton: {
    padding: 4,
    marginLeft: 4,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingBadge: {
    position: 'absolute',
    top: -18,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D946EF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  recordingText: { color: '#fff', fontSize: 12, marginLeft: 4 },

  /* Emoji modal */
  emojiOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  emojiPanel: {
    height: EMOJI_DEFAULTS.panelHeight,
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
    marginBottom: 12
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
});

export default MessageInput;
