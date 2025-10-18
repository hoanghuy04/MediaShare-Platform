import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@hooks/useTheme';
import { CreatePostFlow } from '@components/create/CreatePostFlow';

export default function CreateScreen() {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <CreatePostFlow />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

