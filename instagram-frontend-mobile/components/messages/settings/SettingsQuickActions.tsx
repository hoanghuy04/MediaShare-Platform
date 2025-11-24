import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

type Props = {
  isGroup: boolean;
  isAI: boolean;
  gradientColors: string[];
  onViewProfileOrEditGroup: () => void;
  onSearch: () => void;
  onToggleNotification: () => void;
  onOpenMenu: () => void;
  menuButtonRef: React.RefObject<TouchableOpacity | null>;
  textColor: string;
};

export const SettingsQuickActions: React.FC<Props> = ({
  isGroup,
  isAI,
  gradientColors,
  onViewProfileOrEditGroup,
  onSearch,
  onToggleNotification,
  onOpenMenu,
  menuButtonRef,
  textColor,
}) => {
  return (
    <View style={styles.quickActions}>
      {/* Trang cá nhân / Chỉnh sửa nhóm */}
      <TouchableOpacity
        style={styles.quickActionItem}
        onPress={onViewProfileOrEditGroup}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.quickActionIcon}
        >
          <Ionicons
            name={isGroup ? 'pencil-outline' : 'person-outline'}
            size={20}
            color="white"
          />
        </LinearGradient>
        <Text style={[styles.quickActionText, { color: textColor }]}>
          {isGroup ? 'Chỉnh sửa nhóm' : 'Trang cá nhân'}
        </Text>
      </TouchableOpacity>

      {/* Tìm kiếm */}
      <TouchableOpacity
        style={styles.quickActionItem}
        onPress={onSearch}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.quickActionIcon}
        >
          <Ionicons name="search-outline" size={20} color="white" />
        </LinearGradient>
        <Text style={[styles.quickActionText, { color: textColor }]}>
          Tìm kiếm
        </Text>
      </TouchableOpacity>

      {/* Tắt thông báo */}
      <TouchableOpacity
        style={styles.quickActionItem}
        onPress={onToggleNotification}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.quickActionIcon}
        >
          <Ionicons name="notifications-off-outline" size={20} color="white" />
        </LinearGradient>
        <Text style={[styles.quickActionText, { color: textColor }]}>
          Tắt thông báo
        </Text>
      </TouchableOpacity>

      {/* Lựa chọn (ẩn nếu AI) */}
      {!isAI && (
        <TouchableOpacity
          ref={menuButtonRef}
          style={styles.quickActionItem}
          onPress={onOpenMenu}
        >
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.quickActionIcon}
          >
            <Ionicons
              name="ellipsis-horizontal-outline"
              size={20}
              color="white"
            />
          </LinearGradient>
          <Text style={[styles.quickActionText, { color: textColor }]}>
            Lựa chọn
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  quickActionItem: { alignItems: 'center', flex: 1 },
  quickActionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
});

