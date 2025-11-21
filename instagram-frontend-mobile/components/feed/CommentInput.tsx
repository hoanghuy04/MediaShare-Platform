import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@hooks/useTheme';

interface CommentInputProps {
  onSend: (text: string) => void;
  placeholder?: string;
  mentionText?: string;
  onClearMention?: () => void;
}

export interface CommentInputRef {
  focus: () => void;
}

export const CommentInput = forwardRef<CommentInputRef, CommentInputProps>(({
  onSend,
  placeholder = 'Thêm bình luận...',
  mentionText,
  onClearMention,
}, ref) => {
  const { theme } = useTheme();
  const [text, setText] = useState('');
  const inputRef = useRef<TextInput>(null);

  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus();
    },
  }));

  const handleSend = () => {
    if (text.trim()) {
      onSend(text.trim());
      setText('');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background, borderTopColor: theme.colors.border }]}>
      {mentionText && (
        <View style={styles.mentionBar}>
          <Text style={[styles.mentionText, { color: theme.colors.primary }]}>
            {mentionText}
          </Text>
          <TouchableOpacity onPress={onClearMention} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close-circle" size={18} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>
      )}
      
      <View style={styles.inputContainer}>
        <TextInput
          ref={inputRef}
          value={text}
          onChangeText={setText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.placeholder}
          style={[styles.input, { color: theme.colors.text }]}
          multiline
          maxLength={500}
        />
        
        {text.trim().length > 0 && (
          <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
            <Text style={[styles.sendText, { color: theme.colors.primary }]}>Đăng</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 0.5,
  },
  mentionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 122, 255, 0.05)',
  },
  mentionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    fontSize: 14,
    maxHeight: 80,
  },
  sendButton: {
    marginLeft: 12,
  },
  sendText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
