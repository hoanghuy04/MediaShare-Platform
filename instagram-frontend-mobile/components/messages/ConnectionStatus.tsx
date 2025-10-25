import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

interface ConnectionStatusProps {
  status: 'connected' | 'connecting' | 'disconnected' | 'reconnecting';
  onRetry?: () => void;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ status, onRetry }) => {
  const { theme } = useTheme();

  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          icon: 'checkmark-circle' as const,
          text: 'Connected',
          color: '#4CAF50',
          showRetry: false,
        };
      case 'connecting':
        return {
          icon: 'sync' as const,
          text: 'Connecting...',
          color: '#FF9800',
          showRetry: false,
        };
      case 'reconnecting':
        return {
          icon: 'refresh' as const,
          text: 'Reconnecting...',
          color: '#FF9800',
          showRetry: false,
        };
      case 'disconnected':
        return {
          icon: 'close-circle' as const,
          text: 'Disconnected',
          color: '#F44336',
          showRetry: true,
        };
      default:
        return {
          icon: 'help-circle' as const,
          text: 'Unknown',
          color: theme.colors.textSecondary,
          showRetry: false,
        };
    }
  };

  const config = getStatusConfig();

  if (status === 'connected') {
    return null; // Don't show status when connected
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.content}>
        <Ionicons 
          name={config.icon} 
          size={16} 
          color={config.color}
          style={styles.icon}
        />
        <Text style={[styles.text, { color: config.color }]}>
          {config.text}
        </Text>
        {config.showRetry && onRetry && (
          <TouchableOpacity onPress={onRetry} style={styles.retryButton}>
            <Ionicons name="refresh" size={16} color={theme.colors.primary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 8,
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
  },
  retryButton: {
    marginLeft: 8,
    padding: 4,
  },
});
