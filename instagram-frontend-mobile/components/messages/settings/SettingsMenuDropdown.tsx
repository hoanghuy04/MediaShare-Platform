import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Modal, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  visible: boolean;
  position: { top: number; right: number };
  isGroup: boolean;
  onClose: () => void;
  onLeaveGroup: () => void;
  onHide: () => void;
  onRestrict: () => void;
  onBlock: () => void;
  onReport: () => void;
  themeColors: {
    text: string;
  };
};

export const SettingsMenuDropdown: React.FC<Props> = ({
  visible,
  position,
  isGroup,
  onClose,
  onLeaveGroup,
  onHide,
  onRestrict,
  onBlock,
  onReport,
  themeColors,
}) => {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.menuOverlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject as any}
          onPress={onClose}
        />
        <View
          style={[
            styles.menuCard,
            { top: position.top, right: position.right },
          ]}
        >
          {isGroup ? (
            <>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  onClose();
                  onLeaveGroup();
                }}
              >
                <Ionicons
                  name="exit-outline"
                  size={20}
                  color="#ef4444"
                  style={{ marginRight: 10 }}
                />
                <Text
                  style={[
                    styles.menuItemText,
                    { color: '#ef4444' },
                  ]}
                >
                  Rời khỏi nhóm
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  onClose();
                  onHide();
                }}
              >
                <Ionicons
                  name="eye-off-outline"
                  size={20}
                  color={themeColors.text}
                  style={{ marginRight: 10 }}
                />
                <Text
                  style={[
                    styles.menuItemText,
                    { color: themeColors.text },
                  ]}
                >
                  Ẩn
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  onClose();
                  onRestrict();
                }}
              >
                <Ionicons
                  name="shield-half-outline"
                  size={20}
                  color={themeColors.text}
                  style={{ marginRight: 10 }}
                />
                <Text
                  style={[
                    styles.menuItemText,
                    { color: themeColors.text },
                  ]}
                >
                  Hạn chế
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                onClose();
                onRestrict();
              }}
            >
              <Ionicons
                name="shield-half-outline"
                size={20}
                color={themeColors.text}
                style={{ marginRight: 10 }}
              />
              <Text
                style={[
                  styles.menuItemText,
                  { color: themeColors.text },
                ]}
              >
                Hạn chế
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              onClose();
              onBlock();
            }}
          >
            <Ionicons
              name="close-circle-outline"
              size={20}
              color="#ef4444"
              style={{ marginRight: 10 }}
            />
            <Text
              style={[
                styles.menuItemText,
                { color: '#ef4444' },
              ]}
            >
              Chặn
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              onClose();
              onReport();
            }}
          >
            <Ionicons
              name="alert-circle-outline"
              size={20}
              color="#ef4444"
              style={{ marginRight: 10 }}
            />
            <Text
              style={[
                styles.menuItemText,
                { color: '#ef4444' },
              ]}
            >
              Báo cáo
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  menuOverlay: { flex: 1 },
  menuCard: {
    position: 'absolute',
    borderRadius: 12,
    paddingVertical: 6,
    minWidth: 230,
    backgroundColor: 'white',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 10 },
    }),
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  menuItemText: { fontSize: 15, fontWeight: '700' },
});

