import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { messageAPI } from '../../services/message.service';
import { showAlert } from '../../utils/helpers';

interface MessageButtonProps {
  label?: string;
  userId: string; // ID của user cần nhắn tin
  onPress?: () => void; // Optional custom handler
  loading?: boolean;
  size?: 'small' | 'medium' | 'large';
  backgroundColor?: string;
  textColor?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const MessageButton: React.FC<MessageButtonProps> = ({
  label = 'Nhắn tin',
  userId,
  onPress,
  loading: externalLoading = false,
  size = 'medium',
  backgroundColor,
  textColor,
  style,
  textStyle,
}) => {
  const { theme } = useTheme();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [internalLoading, setInternalLoading] = useState(false);
  
  const loading = externalLoading || internalLoading;

  const handlePress = async () => {
    if (onPress) {
      onPress();
      return;
    }

    if (!currentUser?.id || !userId) {
      showAlert('Lỗi', 'Không thể gửi tin nhắn');
      return;
    }

    try {
      setInternalLoading(true);
      // Resolve or create conversation
      const convId = await messageAPI.resolveDirectByPeer(userId);
      if (convId) {
        router.push({
          pathname: '/messages/[conversationId]',
          params: { conversationId: convId },
        });
      } else {
        router.push({
          pathname: '/messages/[conversationId]',
          params: {
            conversationId: userId,
            isNewConversation: 'true',
            direction: 'sent',
            senderId: currentUser.id,
            receiverId: userId,
          },
        });
      }
    } catch (error: any) {
      console.error('Error opening message:', error);
      showAlert('Lỗi', error.message || 'Không thể mở tin nhắn');
    } finally {
      setInternalLoading(false);
    }
  };

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
      onPress={handlePress}
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
