import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface MessageButtonProps {
  label?: string;
  onPress: () => void;
  loading?: boolean;
  size?: 'small' | 'medium' | 'large';
  backgroundColor?: string;
  textColor?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const MessageButton: React.FC<MessageButtonProps> = ({
  label = 'Nhắn tin',
  onPress,
  loading = false,
  size = 'medium',
  backgroundColor,
  textColor,
  style,
  textStyle,
}) => {
  const { theme } = useTheme();

  // --- Copy from FollowButton ---
  const getPadding = () => {
    switch (size) {
      case 'small':
        return { paddingVertical: 6, paddingHorizontal: 12 };
      case 'large':
        return { paddingVertical: 10, paddingHorizontal: 20 };
      case 'medium':
      default:
        return { paddingVertical: 8, paddingHorizontal: 16 };
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'small':
        return 13;
      case 'large':
        return 16;
      case 'medium':
      default:
        return 14;
    }
  };

  const bg = backgroundColor ?? theme.colors.inputBackground;
  const color = textColor ?? theme.colors.text;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.7}
      style={[
        styles.button,
        {
          backgroundColor: bg,
          borderWidth: 1,
          borderColor: '#E0E0E0',
          ...getPadding(),
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={color} size="small" />
      ) : (
        <Text
          style={[
            styles.text,
            {
              color,
              fontSize: getFontSize(),
            },
            textStyle,
          ]}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  text: {
    fontWeight: '600',
  },
});
