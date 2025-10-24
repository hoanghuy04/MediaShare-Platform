import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type LeftToolbarProps = {
  visible: boolean;
};

export function LeftToolbar({ visible }: LeftToolbarProps) {
  if (!visible) return null;

  return (
    <View style={styles.leftToolbar}>
      <ToolbarIcon name="musical-notes-outline" label="Âm thanh" />
      <ToolbarIcon name="sparkles-outline" label="Hiệu ứng" />
      <ToolbarIcon name="grid-outline" label="Bố cục video" />
      <ToolbarIcon name="person-outline" label="Phông xanh" />
      <ToolbarIcon name="create-outline" badge="MỚI" label="Chỉnh sửa" />
      <ToolbarIcon name="chevron-down" />
    </View>
  );
}

function ToolbarIcon({
  name,
  badge,
  label,
}: {
  name: keyof typeof Ionicons.glyphMap;
  badge?: string;
  label?: string;
}) {
  return (
    <TouchableOpacity style={styles.toolbarIconWrapper}>
      {!!badge && (
        <View style={styles.toolbarBadge}>
          <Text style={styles.toolbarBadgeText}>{badge}</Text>
        </View>
      )}
      <Ionicons name={name} size={26} color="#fff" />
      {!!label && <Text style={styles.toolbarLabel}>{label}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  leftToolbar: {
    position: 'absolute',
    left: 16,
    top: SCREEN_HEIGHT * 0.22,
    zIndex: 20,
  },
  toolbarIconWrapper: {
    marginBottom: 20,
    position: 'relative',
    alignItems: 'center',
  },
  toolbarBadge: {
    position: 'absolute',
    top: -8,
    left: -8,
    backgroundColor: '#007bff',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
    zIndex: 30,
  },
  toolbarBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    lineHeight: 10,
  },
  toolbarLabel: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
});
