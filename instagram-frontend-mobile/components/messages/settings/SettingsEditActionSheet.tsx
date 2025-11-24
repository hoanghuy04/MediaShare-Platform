import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Modal } from 'react-native';

type Props = {
  visible: boolean;
  onClose: () => void;
  onRename: () => void;
  onChangeAvatar: () => void;
};

export const SettingsEditActionSheet: React.FC<Props> = ({
  visible,
  onClose,
  onRename,
  onChangeAvatar,
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
        <TouchableOpacity
          style={styles.sheetItem}
          onPress={() => {
            onClose();
            onRename();
          }}
        >
          <Text style={styles.sheetItemText}>Đổi tên</Text>
        </TouchableOpacity>
        <View style={styles.sheetDivider} />
        <TouchableOpacity
          style={styles.sheetItem}
          onPress={() => {
            onClose();
            onChangeAvatar();
          }}
        >
          <Text style={styles.sheetItemText}>Đổi avatar</Text>
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

