import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@hooks/useTheme';

interface MessageInputProps {
  onSend: (message: string) => void;
  placeholder?: string;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSend,
  placeholder = 'Message...',
}) => {
  const { theme } = useTheme();
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim()) {
      onSend(message.trim());
      setMessage('');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <TextInput
        value={message}
        onChangeText={setMessage}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.placeholder}
        style={[
          styles.input,
          {
            backgroundColor: theme.colors.surface,
            color: theme.colors.text,
          },
        ]}
        multiline
        maxLength={500}
      />
      
      <TouchableOpacity
        onPress={handleSend}
        disabled={!message.trim()}
        style={styles.sendButton}
      >
        <Ionicons
          name="send"
          size={24}
          color={message.trim() ? theme.colors.primary : theme.colors.textSecondary}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 16,
  },
  sendButton: {
    marginLeft: 8,
    padding: 8,
  },
});

