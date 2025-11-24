import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  left: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  danger?: boolean;
  showChevron?: boolean;
  textColor: string;
  textSecondaryColor: string;
};

export const SettingsRow: React.FC<Props> = ({
  left,
  title,
  subtitle,
  onPress,
  danger = false,
  showChevron = true,
  textColor,
  textSecondaryColor,
}) => {
  return (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      activeOpacity={onPress ? 0.8 : 1}
    >
      <View style={styles.settingIcon}>{left}</View>
      <View style={styles.settingContent}>
        <Text
          style={[
            styles.settingTitle,
            { color: danger ? '#ef4444' : textColor },
          ]}
        >
          {title}
        </Text>
        {!!subtitle && (
          <Text
            style={[
              styles.settingSubtitle,
              { color: textSecondaryColor },
            ]}
          >
            {subtitle}
          </Text>
        )}
      </View>
      {showChevron && (
        <Ionicons
          name="chevron-forward"
          size={16}
          color={textSecondaryColor}
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  settingContent: { flex: 1 },
  settingTitle: { fontSize: 16, fontWeight: '500', marginBottom: 2 },
  settingSubtitle: { fontSize: 14 },
});

