import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

interface MessageInputProps {
  onSend: (message: string) => void;
  onTyping?: () => void;
  onStopTyping?: () => void;
  placeholder?: string;
  themeColor?: string;
}


const TOOLBAR_H = 44;        // chiều cao chuẩn cho tất cả
const BTN = 40;              // kích thước nút tròn
const RADIUS = 20;

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
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    if (isRecording) {
      timer = setInterval(() => {
        setRecordSeconds(prev => prev + 1);
      }, 1000);
    } else {
      setRecordSeconds(0);
    }

    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [isRecording]);

  const handleSend = () => {
    if (message.trim()) {
      onSend(message.trim());
      setMessage('');
      handleStopTyping();
    }
  };

  const handleTextChange = (text: string) => {
    setMessage(text);
    if (text.trim()) {
      onTyping?.();
    } else {
      onStopTyping?.();
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      handleStopTyping();
    }, 1200);
  };

  const handleStopTyping = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    onStopTyping?.();
  };

  const handleAttachmentPress = () => {
    const options = ['Ảnh/Video', 'Sticker', 'File', 'Hủy'];
    if (Platform.OS === 'ios') {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const ActionSheet = require('react-native').ActionSheetIOS;
      ActionSheet.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: options.length - 1,
          title: 'Chia sẻ',
        },
        () => {}
      );
    } else {
      Alert.alert('Chia sẻ', 'Chọn loại nội dung bạn muốn gửi');
    }
  };

  const toggleRecording = () => {
    setIsRecording(prev => !prev);
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        style={[styles.attachButton, { backgroundColor: theme.chat.fabBg }]}
        onPress={handleAttachmentPress}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={24} color={theme.colors.text} />
      </TouchableOpacity>
      <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface }]}>
        <TextInput
          value={message}
          onChangeText={handleTextChange}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textSecondary}
          style={[styles.input, { color: theme.colors.text }]}
          multiline
        />
        <View style={styles.inputActions}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="happy-outline" size={22} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={toggleRecording}>
            <Ionicons
              name={isRecording ? 'stop-circle' : 'mic-outline'}
              size={22}
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
          <Ionicons name='pulse' size={12} color="#fff" />
          <Text style={styles.recordingText}>{recordSeconds}s</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    gap: 8,
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
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 15,
    maxHeight: 120,
  },
  inputActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 6,
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
  recordingText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 4,
  },
});

