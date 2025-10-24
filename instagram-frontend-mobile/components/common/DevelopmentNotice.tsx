import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@hooks/useTheme';

interface DevelopmentNoticeProps {
  title?: string;
  message?: string;
  icon?: string;
}

export const DevelopmentNotice: React.FC<DevelopmentNoticeProps> = ({
  title = 'Đang phát triển',
  message = 'Tính năng này đang được phát triển và sẽ sớm có mặt.',
  icon = 'construct-outline',
}) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <Ionicons 
        name={icon as any} 
        size={48} 
        color={theme.colors.primary} 
        style={styles.icon}
      />
      <Text style={[styles.title, { color: theme.colors.text }]}>
        {title}
      </Text>
      <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
        {message}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
