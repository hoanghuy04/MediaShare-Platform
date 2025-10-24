import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@hooks/useTheme';

export const CaughtUpNotice: React.FC = () => {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: theme.colors.surface }]}>
        <Ionicons name="checkmark-circle" size={32} color={theme.colors.textSecondary} />
      </View>
      <Text style={[styles.text, { color: theme.colors.textSecondary }]}>
        Bạn đã xem các bài viết mới nhất của những tài khoản mình theo dõi.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  iconContainer: {
    marginRight: 12,
  },
  text: {
    flex: 1,
    fontSize: 14,
    lineHeight: 18,
  },
});

