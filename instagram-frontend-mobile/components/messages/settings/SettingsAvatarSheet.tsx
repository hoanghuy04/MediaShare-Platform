import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Modal } from 'react-native';

type Props = {
  visible: boolean;
  saving: boolean;
  onClose: () => void;
  onRemove: () => void;
  onTakePhoto: () => void;
  onPickFromLibrary: () => void;
};

export const SettingsAvatarSheet: React.FC<Props> = ({
  visible,
  saving,
  onClose,
  onRemove,
  onTakePhoto,
  onPickFromLibrary,
}) => {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.sheetOverlay}
        onPress={onClose}
      />
      <View style={styles.sheetCard}>
        <TouchableOpacity style={styles.sheetItem} onPress={onRemove}>
          <Text style={[styles.sheetItemText, { color: '#ef4444' }]}>
            {saving ? 'Đang gỡ…' : 'Gỡ'}
          </Text>
        </TouchableOpacity>
        <View style={styles.sheetDivider} />
        <TouchableOpacity style={styles.sheetItem} onPress={onTakePhoto}>
          <Text style={styles.sheetItemText}>Chụp ảnh</Text>
        </TouchableOpacity>
        <View style={styles.sheetDivider} />
        <TouchableOpacity style={styles.sheetItem} onPress={onPickFromLibrary}>
          <Text style={styles.sheetItemText}>Chọn ảnh</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)' },
  sheetCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    backgroundColor: 'white',
    paddingVertical: 8,
  },
  sheetItem: { paddingVertical: 16, paddingHorizontal: 20 },
  sheetItemText: { fontSize: 16, fontWeight: '600' },
  sheetDivider: { height: 1, backgroundColor: '#eee' },
});

