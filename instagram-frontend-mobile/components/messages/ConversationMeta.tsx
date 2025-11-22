// components/messages/ConversationMeta.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserProfile, Message } from '../../types';
import { Theme } from '../../hooks/useTheme';

const hexToRgba = (hex?: string, alpha = 1) => {
  if (!hex) return `rgba(0,0,0,${alpha})`;
  const s = hex.replace('#', '');
  if (s.length !== 6) return `rgba(0,0,0,${alpha})`;
  const n = parseInt(s, 16);
  const r = (n >> 16) & 255,
    g = (n >> 8) & 255,
    b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
};

interface Props {
  wantsPendingRoute: boolean;
  messages: Message[];
  otherUser: UserProfile | null;
  isGroupConversation?: boolean;
  recentMedia: Message[];
  theme: Theme;
}

export const ConversationMeta: React.FC<Props> = ({
  wantsPendingRoute,
  messages,
  otherUser,
  isGroupConversation,
  recentMedia,
  theme,
}) => {
  const showContactIntro = messages.length === 0 && !!otherUser && !isGroupConversation;
  const showDateSeparator = messages.length > 0;

  return (
    <>
      {/* {wantsPendingRoute && (
        <View
          style={[
            styles.pendingBanner,
            {
              backgroundColor: hexToRgba(theme.colors.warning, 0.08),
              borderColor: hexToRgba(theme.colors.warning, 0.5),
            },
          ]}
        >
          <Ionicons
            name="time-outline"
            size={18}
            color={theme.colors.warning || '#FF9500'}
          />
          <View style={styles.pendingBannerText}>
            <Text style={[styles.pendingBannerTitle, { color: theme.colors.text }]}>
              Tin nhắn đang chờ
            </Text>
            <Text
              style={[
                styles.pendingBannerSubtitle,
                { color: theme.colors.textSecondary },
              ]}
            >
              Người nhận cần chấp nhận để bắt đầu cuộc trò chuyện.
            </Text>
          </View>
        </View>
      )} */}

      {showContactIntro && (
        <View style={styles.contactInfo}>
          <Image
            source={{
              uri: otherUser?.profile?.avatar || 'https://via.placeholder.com/100',
            }}
            style={styles.largeAvatar}
          />
          <Text style={[styles.contactName, { color: theme.colors.text }]}>
            {otherUser?.profile?.firstName || otherUser?.username || 'User'}
          </Text>
          <Text
            style={[
              styles.contactHandle,
              { color: theme.colors.textSecondary },
            ]}
          >
            @{otherUser?.username || 'user'}
          </Text>
          <TouchableOpacity
            style={[
              styles.profileButton,
              { backgroundColor: hexToRgba(theme.colors.border, 0.6) },
            ]}
          >
            <Text
              style={[
                styles.profileButtonText,
                { color: theme.colors.text },
              ]}
            >
              Xem trang cá nhân
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {recentMedia.length > 0 && (
        <View style={styles.mediaStripContainer}>
          <Text style={[styles.mediaStripTitle, { color: theme.colors.text }]}>
            Ảnh/Video gần đây
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 16 }}
          >
            {recentMedia.map(m => (
              <TouchableOpacity
                key={m.id}
                style={styles.mediaPreview}
                onPress={() => {}}
              >
                <Image
                  source={{ uri: m.mediaUrl || undefined }}
                  style={styles.mediaImage}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {showDateSeparator && (
        <View style={styles.dateSeparator}>
          <View
            style={[
              styles.datePill,
              {
                backgroundColor: hexToRgba(theme.colors.card, 0.9),
                borderColor: hexToRgba(theme.colors.border, 0.9),
              },
            ]}
          >
            <Text
              style={[
                styles.dateText,
                { color: theme.colors.textSecondary },
              ]}
            >
              04 thg 9, 2024
            </Text>
          </View>
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  // Pending banner
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  pendingBannerText: { marginLeft: 12, flex: 1 },
  pendingBannerTitle: { fontSize: 14, fontWeight: '700' },
  pendingBannerSubtitle: { fontSize: 12, marginTop: 2 },

  // Intro
  contactInfo: {
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 20,
  },
  largeAvatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: 14,
  },
  contactName: { fontSize: 22, fontWeight: '600', marginBottom: 4 },
  contactHandle: { fontSize: 14, marginBottom: 18 },
  profileButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 18,
  },
  profileButtonText: { fontSize: 15, fontWeight: '600' },

  // Media strip
  mediaStripContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  mediaStripTitle: { fontSize: 14, fontWeight: '700', marginBottom: 6 },
  mediaPreview: {
    width: 84,
    height: 84,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 10,
    backgroundColor: '#EEE',
  },
  mediaImage: { width: '100%', height: '100%' },

  // Date separator
  dateSeparator: { alignItems: 'center', marginTop: 6, marginBottom: 2 },
  datePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  dateText: { fontSize: 12, fontWeight: '600' },
});
