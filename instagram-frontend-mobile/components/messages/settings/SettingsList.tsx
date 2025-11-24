import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SettingsRow } from './SettingsRow';
import { Conversation, UserProfile } from '../../../types';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  isGroup: boolean;
  conversation: Conversation | undefined;
  otherUser: UserProfile | null;
  themeColors: {
    text: string;
    textSecondary: string;
  };
  onOpenThemePicker: () => void;
  onOpenMembers: () => void;
  onCreateGroupFromDirect: () => void;
  onCreateGroupFromGroup: () => void;
};

export const SettingsList: React.FC<Props> = ({
  isGroup,
  conversation,
  otherUser,
  themeColors,
  onOpenThemePicker,
  onOpenMembers,
  onCreateGroupFromDirect,
  onCreateGroupFromGroup,
}) => {
  const isAI = otherUser?.username === 'ai-assistant' || otherUser?.username === 'AI Assistant';

  return (
    <View style={styles.settingsList}>
      {/* Chủ đề */}
      <SettingsRow
        left={
          <View
            style={[
              styles.themeDot,
              { backgroundColor: (conversation as any)?.theme?.tint || '#8B5CF6' },
            ]}
          />
        }
        title="Chủ đề"
        subtitle={
          (conversation as any)?.theme?.themeKey
            ? (conversation as any).theme.themeKey
            : 'Mặc định'
        }
        onPress={onOpenThemePicker}
        textColor={themeColors.text}
        textSecondaryColor={themeColors.textSecondary}
      />

      {/* Direct: Tin nhắn tự hủy; Group: Liên kết mời + Mọi người */}
      {!isGroup && (
        <SettingsRow
          left={<Ionicons name="time-outline" size={24} color={themeColors.text} />}
          title="Tin nhắn tự hủy"
          subtitle="Đang tắt"
          textColor={themeColors.text}
          textSecondaryColor={themeColors.textSecondary}
        />
      )}

      {isGroup && (
        <SettingsRow
          left={<Ionicons name="link-outline" size={24} color={themeColors.text} />}
          title="Liên kết mời"
          subtitle={(conversation as any)?.inviteLink || 'Tạo liên kết mời'}
          textColor={themeColors.text}
          textSecondaryColor={themeColors.textSecondary}
        />
      )}

      {isGroup && (
        <SettingsRow
          left={<Ionicons name="people-outline" size={24} color={themeColors.text} />}
          title="Mọi người"
          subtitle={`${conversation?.participants?.length || 0} thành viên`}
          onPress={onOpenMembers}
          textColor={themeColors.text}
          textSecondaryColor={themeColors.textSecondary}
        />
      )}

      <SettingsRow
        left={<Ionicons name="lock-closed-outline" size={24} color={themeColors.text} />}
        title="Quyền riêng tư và an toàn"
        textColor={themeColors.text}
        textSecondaryColor={themeColors.textSecondary}
      />

      <SettingsRow
        left={<Ionicons name="person-circle-outline" size={24} color={themeColors.text} />}
        title="Biệt danh"
        textColor={themeColors.text}
        textSecondaryColor={themeColors.textSecondary}
      />

      {!isGroup && !isAI && (
        <SettingsRow
          left={<Ionicons name="people-outline" size={24} color={themeColors.text} />}
          title="Tạo nhóm chat mới"
          onPress={onCreateGroupFromDirect}
          textColor={themeColors.text}
          textSecondaryColor={themeColors.textSecondary}
        />
      )}

      {isGroup && (
        <SettingsRow
          left={<Ionicons name="people-outline" size={24} color={themeColors.text} />}
          title="Tạo nhóm chat mới"
          onPress={onCreateGroupFromGroup}
          textColor={themeColors.text}
          textSecondaryColor={themeColors.textSecondary}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  settingsList: { paddingTop: 16 },
  themeDot: { width: 24, height: 24, borderRadius: 12 },
});

