import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@hooks/useTheme';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Search',
  onClear,
}) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
      
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.placeholder}
        style={[styles.input, { color: theme.colors.text }]}
        autoCapitalize="none"
        autoCorrect={false}
      />
      
      {value.length > 0 && (
        <TouchableOpacity onPress={onClear}>
          <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  input: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
});

