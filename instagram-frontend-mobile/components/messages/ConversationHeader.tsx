import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../common/Avatar';

interface Props {
  headerBg: string;
  headerTextColor: string;
  title: string;
  subtitle: string;
  avatarSrc?: string | null;
  isGroupConversation?: boolean;
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | string;
  onBack: () => void;
  onOpenSettings: () => void; // nhấn vào header để mở info / setting
  onOpenInfo: () => void;     // vẫn giữ để dùng nếu cần
  onAddMembers?: () => void;  // icon thêm thành viên
}

export const ConversationHeader: React.FC<Props> = ({
  headerBg,
  headerTextColor,
  title,
  subtitle,
  avatarSrc,
  isGroupConversation,
  connectionStatus,
  onBack,
  onOpenSettings,
  onOpenInfo,
  onAddMembers,
}) => {
  const isAiChat =
    title === 'ai-assistant' || title === 'AI Assistant';

  return (
      <View style={[styles.headerContent, { backgroundColor: headerBg }]}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons
            name="arrow-back"
            size={22}
            color={headerTextColor}
          />
        </TouchableOpacity>

        {/* Nhấn vào phần giữa để mở thông tin cuộc trò chuyện */}
        <TouchableOpacity
          style={styles.headerInfo}
          onPress={onOpenSettings}
          activeOpacity={0.8}
        >
          <Avatar uri={avatarSrc || undefined} name={title} size={40} />
          <View style={styles.headerTextGroup}>
            <View style={styles.headerTitleRow}>
              <Text
                style={[
                  styles.userName,
                  { color: headerTextColor },
                ]}
                numberOfLines={1}
              >
                {title}
              </Text>
              {!isGroupConversation && (
                <View
                  style={[
                    styles.onlineDot,
                    {
                      backgroundColor:
                        connectionStatus === 'connected'
                          ? '#34D399'
                          : '#94A3B8',
                    },
                  ]}
                />
              )}
            </View>
            {!!subtitle && (
              <Text
                style={[
                  styles.userHandle,
                  { color: headerTextColor, opacity: 0.9 },
                ]}
                numberOfLines={1}
              >
                {subtitle}
              </Text>
            )}
          </View>
        </TouchableOpacity>

        {/* Các icon bên phải: thêm thành viên, gọi, video */}
        <View style={styles.headerActions}>
          {!isAiChat && (
            <>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={onAddMembers || onOpenInfo}
              >
                <Ionicons
                  name="person-add-outline"
                  size={20}
                  color={headerTextColor}
                />
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton}>
                <Ionicons
                  name="call-outline"
                  size={20}
                  color={headerTextColor}
                />
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton}>
                <Ionicons
                  name="videocam-outline"
                  size={20}
                  color={headerTextColor}
                />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
  );
};

const styles = StyleSheet.create({
  headerWrapper: { zIndex: 5, backgroundColor: 'transparent' },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 3 },
    }),
  },
  backButton: { marginRight: 6, padding: 6, borderRadius: 18 },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTextGroup: { marginLeft: 10, flex: 1 },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: { fontSize: 17, fontWeight: '700', flexShrink: 1 },
  userHandle: { fontSize: 12, marginTop: 2 },
  onlineDot: { width: 9, height: 9, borderRadius: 5, marginLeft: 6 },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  actionButton: { padding: 8, marginLeft: 2 },
});

export default ConversationHeader;
