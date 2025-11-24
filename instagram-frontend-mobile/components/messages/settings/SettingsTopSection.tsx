import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Avatar } from '../../../components/common/Avatar';
import { Conversation, UserProfile } from '../../../types';

type Props = {
  isGroup: boolean;
  conversation: Conversation | undefined;
  otherUser: UserProfile | null;
  themeColors: {
    text: string;
    textSecondary: string;
    primary: string;
  };
  onViewProfile?: () => void;
};

export const SettingsTopSection: React.FC<Props> = ({
  isGroup,
  conversation,
  otherUser,
  themeColors,
  onViewProfile,
}) => {
  if (!isGroup) {
    const isAI = otherUser?.username === 'ai-assistant' || otherUser?.username === 'AI Assistant';
    
    return (
      <View style={styles.profileSection}>
        <Avatar
          uri={otherUser?.profile?.avatar}
          name={otherUser?.profile?.firstName || otherUser?.username}
          size={100}
        />
        <Text style={[styles.titleName, { color: themeColors.text }]}>
          {otherUser?.username || 'User'}
        </Text>
        {!isAI ? (
          <TouchableOpacity onPress={onViewProfile}>
            <Text style={[styles.linkAction, { color: themeColors.primary }]}>
              Xem trang cá nhân
            </Text>
          </TouchableOpacity>
        ) : (
          <Text
            style={[
              styles.settingSubtitle,
              { color: themeColors.textSecondary, marginTop: 6 },
            ]}
          >
            Dùng Openai 3.5
          </Text>
        )}
      </View>
    );
  }

  return (
    <View style={styles.profileSection}>
      <Avatar
        uri={(conversation as any)?.avatar}
        name={conversation?.name || 'Nhóm chat'}
        size={100}
      />
      <Text style={[styles.titleName, { color: themeColors.text }]}>
        {conversation?.name || 'Nhóm chat'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  profileSection: {
    alignItems: 'center',
    paddingTop: 36,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  titleName: {
    fontSize: 24,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  linkAction: { marginTop: 6, fontSize: 14, fontWeight: '600' },
  settingSubtitle: { fontSize: 14 },
});

