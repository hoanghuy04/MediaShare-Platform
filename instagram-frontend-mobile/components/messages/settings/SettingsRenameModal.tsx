import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Modal, TextInput } from 'react-native';

type Props = {
  visible: boolean;
  value: string;
  saving: boolean;
  onChangeValue: (v: string) => void;
  onClear: () => void;
  onCancel: () => void;
  onSave: () => void;
};

export const SettingsRenameModal: React.FC<Props> = ({
  visible,
  value,
  saving,
  onChangeValue,
  onClear,
  onCancel,
  onSave,
}) => {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.centerOverlay}>
        <View style={styles.renameCard}>
          <Text style={styles.renameHeader}>Chỉnh sửa tên nhóm</Text>
          <View style={styles.renameInputWrap}>
            <TextInput
              value={value}
              onChangeText={onChangeValue}
              placeholder="Nhập tên nhóm"
              style={styles.renameInput}
            />
          </View>

          <View style={styles.renameFooter}>
            <TouchableOpacity onPress={onClear}>
              <Text style={[styles.renameLeft, { color: '#ef4444' }]}>Gỡ</Text>
            </TouchableOpacity>

            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity
                style={{ marginRight: 18 }}
                onPress={onCancel}
              >
                <Text style={{ fontWeight: '600' }}>Huỷ</Text>
              </TouchableOpacity>
              <TouchableOpacity disabled={saving} onPress={onSave}>
                <Text style={{ color: '#0A84FF', fontWeight: '700' }}>
                  {saving ? 'Đang lưu…' : 'Lưu'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  renameCard: {
    width: '86%',
    backgroundColor: 'white',
    borderRadius: 14,
    paddingTop: 14,
    paddingBottom: 8,
  },
  renameHeader: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
  },
  renameInputWrap: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  renameInput: { fontSize: 16, paddingVertical: 8 },
  renameFooter: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  renameLeft: { fontWeight: '700' },
});

