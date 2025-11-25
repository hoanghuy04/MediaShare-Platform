import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  visible: boolean;
  onClose: () => void;
  onTakePhoto: () => void;
  onPickFromLibrary: () => void;
};

export const SettingsEditGroup: React.FC<Props> = ({
  visible,
  onClose,
  onTakePhoto,
  onPickFromLibrary,
}) => {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Đổi ảnh nhóm</Text>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.button} onPress={onTakePhoto}>
              <Ionicons name="camera-outline" size={22} color="#333" style={styles.icon} />
              <Text style={styles.buttonText}>Chụp ảnh</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={onPickFromLibrary}>
              <Ionicons name="images-outline" size={22} color="#333" style={styles.icon} />
              <Text style={styles.buttonText}>Chọn ảnh</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>Đóng</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  actions: {
    gap: 12,
    marginBottom: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  icon: {
    marginRight: 10,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  cancelButton: {
    alignSelf: 'center',
    marginTop: 4,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2563eb',
  },
});

export default SettingsEditGroup;

