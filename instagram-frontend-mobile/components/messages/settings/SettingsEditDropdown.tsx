import React from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';

type Props = {
  visible: boolean;
  position: { top: number; left: number };
  onClose: () => void;
  onRemove: () => void;
  onRename: () => void;
  onChangeAvatar: () => void;
  themeColors: {
    text: string;
    surface: string;
  };
};

export const SettingsEditDropdown: React.FC<Props> = ({
  visible,
  position,
  onClose,
  onRemove,
  onRename,
  onChangeAvatar,
  themeColors,
}) => {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject as any} onPress={onClose} />
        <View
          style={[
            styles.dropdown,
            {
              top: position.top,
              left: position.left,
              backgroundColor: themeColors.surface,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.item}
            onPress={() => {
              onClose();
              onRemove();
            }}
          >
            <Text style={[styles.itemText, styles.danger]}>Gỡ</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.item}
            onPress={() => {
              onClose();
              onRename();
            }}
          >
            <Text style={[styles.itemText, { color: themeColors.text }]}>Đổi tên</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.item}
            onPress={() => {
              onClose();
              onChangeAvatar();
            }}
          >
            <Text style={[styles.itemText, { color: themeColors.text }]}>Đổi avatar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  dropdown: {
    position: 'absolute',
    borderRadius: 12,
    paddingVertical: 4,
    minWidth: 180,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
      },
      android: {
        elevation: 6,
      },
    }),
  },
  item: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  itemText: {
    fontSize: 15,
    fontWeight: '600',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e5e7eb',
  },
  danger: {
    color: '#ef4444',
  },
});


