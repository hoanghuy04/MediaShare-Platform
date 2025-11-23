// app/messages/media-viewer.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Video } from 'expo-av';
import * as Linking from 'expo-linking';
import { useTheme } from '../../hooks/useTheme';
import { MessageType } from '../../types/enum.type';
import { formatMessageTime } from '../../utils/messageUtils';

const { width } = Dimensions.get('window');

export default function MediaViewerScreen() {
  const router = useRouter();
  const { theme } = useTheme();

  const params = useLocalSearchParams<{
    url?: string;
    type?: string;
    senderName?: string;
    avatar?: string;
    createdAt?: string;
  }>();

  const url = params.url || '';
  const type = (params.type || MessageType.IMAGE) as MessageType;
  const senderName = params.senderName || 'Bạn';
  const avatar = params.avatar as string | undefined;
  const createdAt = params.createdAt || '';

  // Format timestamp for display
  const formattedTime = React.useMemo(() => {
    if (!createdAt) return '';
    
    try {
      const date = new Date(createdAt);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      // Today: show time only (e.g., "10:30 AM")
      if (diffHours < 24 && date.getDate() === now.getDate()) {
        return date.toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
        });
      }

      // Yesterday
      if (diffDays === 1) {
        const time = date.toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
        });
        return `Hôm qua lúc ${time}`;
      }

      // Within this week: show day name + time
      if (diffDays < 7) {
        const dayNames = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
        const dayName = dayNames[date.getDay()];
        const time = date.toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
        });
        return `${dayName} lúc ${time}`;
      }

      // Older: show date + time
      const day = date.getDate();
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      const time = date.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      });

      if (year === now.getFullYear()) {
        return `${day}/${month} lúc ${time}`;
      }

      return `${day}/${month}/${year} lúc ${time}`;
    } catch (error) {
      console.error('Error formatting time:', error);
      return createdAt;
    }
  }, [createdAt]);

  const handleClose = () => {
    router.back();
  };

  const handleDownload = async () => {
    if (!url) return;
    // Tạm thời: mở URL trong browser / viewer ngoài
    await Linking.openURL(url);
    // Sau này có thể dùng expo-file-system để tải về và lưu vào gallery
  };

  const renderMedia = () => {
    if (!url) return null;

    if (type === MessageType.VIDEO) {
      return (
        <View style={styles.mediaWrapper}>
          <Video
            source={{ uri: url }}
            style={styles.video}
            resizeMode="contain"
            useNativeControls
            isLooping
          />
        </View>
      );
    }

    // IMAGE
    return (
      <View style={styles.mediaWrapper}>
        <Image
          source={{ uri: url }}
          style={styles.image}
          resizeMode="contain"
        />
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: theme.colors.background || '#fff' },
      ]}
    >
      {/* Header giống Messenger */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} hitSlop={12}>
          <Ionicons name="close" size={26} color={theme.colors.text} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.headerAvatar} />
          ) : (
            <View
              style={[
                styles.headerAvatar,
                { backgroundColor: theme.colors.primary },
              ]}
            >
              <Text style={styles.headerAvatarText}>
                {senderName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.headerTextBlock}>
            <Text
              numberOfLines={1}
              style={[styles.headerName, { color: theme.colors.text }]}
            >
              {senderName}
            </Text>
            {!!formattedTime && (
              <Text
                numberOfLines={1}
                style={[
                  styles.headerTime,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {formattedTime}
              </Text>
            )}
          </View>
        </View>

        <TouchableOpacity onPress={handleDownload} hitSlop={12}>
          <Ionicons
            name="download-outline"
            size={24}
            color={theme.colors.text}
          />
        </TouchableOpacity>
      </View>

      {/* Nội dung media */}
      <View style={styles.body}>{renderMedia()}</View>
    </SafeAreaView>
  );
}

const RADIUS = 22;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 12,
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 8,
  },
  headerAvatarText: {
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 32,
  },
  headerTextBlock: {
    flex: 1,
  },
  headerName: {
    fontSize: 15,
    fontWeight: '600',
  },
  headerTime: {
    fontSize: 12,
    marginTop: 2,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaWrapper: {
    width: width - 24,
    aspectRatio: 9 / 16, // giống frame vertical video
    borderRadius: RADIUS,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
