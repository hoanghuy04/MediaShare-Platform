import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@hooks/useTheme';
import { CreateTabbedFlow } from '@components/create/CreateTabbedFlow';

export default function CreateScreen() {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <CreateTabbedFlow />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
