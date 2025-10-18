import React from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { useTheme } from '@hooks/useTheme';
import { VALIDATION } from '@utils/constants';

interface CaptionInputProps {
  value: string;
  onChangeText: (text: string) => void;
}

export const CaptionInput: React.FC<CaptionInputProps> = ({ value, onChangeText }) => {
  const { theme } = useTheme();
  const characterCount = value.length;
  const maxLength = VALIDATION.caption.maxLength;

  return (
    <View style={styles.container}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Write a caption..."
        placeholderTextColor={theme.colors.placeholder}
        multiline
        maxLength={maxLength}
        style={[styles.input, { color: theme.colors.text }]}
      />
      
      <Text style={[styles.counter, { color: theme.colors.textSecondary }]}>
        {characterCount}/{maxLength}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  input: {
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  counter: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 8,
  },
});

