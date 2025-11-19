import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { Avatar } from './Avatar';

interface ComingSoonProps {
  title: string;
  description: string;
  backButtonText?: string;
  onBackPress: () => void;
  iconType?: 'time' | 'avatar' | 'custom';
  customIcon?: React.ReactNode;
  avatarUri?: string;
  avatarName?: string;
}

export function ComingSoon({
  title,
  description,
  backButtonText = 'Quay lại',
  onBackPress,
  iconType = 'time',
  customIcon,
  avatarUri,
  avatarName,
}: ComingSoonProps) {
  const { theme } = useTheme();

  const renderIcon = () => {
    if (customIcon) {
      return customIcon;
    }

    switch (iconType) {
      case 'avatar':
        return (
          <View style={styles.avatarIconContainer}>
            <Avatar 
              uri={avatarUri} 
              name={avatarName} 
              size={60} 
            />
          </View>
        );
      case 'time':
      default:
        return (
          <Ionicons 
            name="time-outline" 
            size={80} 
            color={theme.colors.textSecondary} 
          />
        );
    }
  };

  return (
    <View style={styles.comingSoonContainer}>
      <View style={styles.iconContainer}>
        {renderIcon()}
      </View>
      <Text style={[styles.comingSoonTitle, { color: theme.colors.text }]}>
        {title}
      </Text>
      <Text style={[styles.comingSoonDescription, { color: theme.colors.textSecondary }]}>
        {description}
      </Text>
      <TouchableOpacity 
        style={[styles.backButton, { backgroundColor: theme.colors.primary }]}
        onPress={onBackPress}
      >
        <Text style={styles.backButtonText}>{backButtonText}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  comingSoonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    marginBottom: 24,
  },
  avatarIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E3F2FD',
    borderWidth: 3,
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  comingSoonTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  comingSoonDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
