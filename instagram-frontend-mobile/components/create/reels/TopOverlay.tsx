import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FlashMode } from 'expo-camera';

type TopOverlayProps = {
  recordState: 'idle' | 'recording' | 'postrecord';
  flash: FlashMode;
  lastClipUri: string | null;
  onToggleFlash: () => void;
  onAvatarPress: () => void;
  onClose?: () => void; // optional, bạn có thể truyền goBack screen cha
};

export function TopOverlay({
  recordState,
  flash,
  lastClipUri,
  onToggleFlash,
  onAvatarPress,
  onClose,
}: TopOverlayProps) {
  // Khi đang quay: chỉ hiện avatar góc phải để tránh rối
  if (recordState === 'recording') {
    return (
      <View style={styles.topRowRecordingOnlyRight}>
        <TouchableOpacity onPress={onAvatarPress} activeOpacity={0.8} style={styles.avatarBubble}>
          <View style={styles.avatarBadge}>
            <Text style={styles.avatarBadgeText}>2</Text>
          </View>
          <Image
            source={lastClipUri ? { uri: lastClipUri } : { uri: 'https://placekitten.com/200/200' }}
            style={styles.avatarInner}
          />
          {/* badge số tin/DM giả thôi */}
        </TouchableOpacity>
      </View>
    );
  }

  // idle / postrecord
  return (
    <View style={styles.topRowWrapper}>
      {/* nút đóng */}
      <View style={styles.topLeft}>
        <TouchableOpacity style={styles.roundBubbleDark} onPress={onClose}>
          <Ionicons name="close" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* cụm flash / tốc độ(1x) / hẹn giờ */}
      <View style={styles.topCenterGroup}>
        <TouchableOpacity onPress={onToggleFlash} style={styles.roundBubbleDark}>
          <Ionicons name={flash === 'on' ? 'flash' : 'flash-off'} size={20} color="#fff" />
        </TouchableOpacity>

        <View style={styles.roundBubbleDark}>
          <Text style={styles.topPillText}>1×</Text>
        </View>

        <View style={styles.roundBubbleDark}>
          <Ionicons name="time-outline" size={20} color="#fff" />
        </View>
      </View>

      {/* avatar góc phải */}
      <View style={styles.topRight}>
        <TouchableOpacity onPress={onAvatarPress} activeOpacity={0.8} style={styles.avatarBubble}>
          <View style={styles.avatarBadge}>
            <Text style={styles.avatarBadgeText}>2</Text>
          </View>
          <Image
            source={lastClipUri ? { uri: lastClipUri } : { uri: 'https://placekitten.com/200/200' }}
            style={styles.avatarInner}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topRowWrapper: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 16 : 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    zIndex: 20,
  },

  topRowRecordingOnlyRight: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 16 : 10,
    right: 12,
    zIndex: 20,
  },

  topLeft: {
    width: 60,
    flexDirection: 'row',
  },

  topCenterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  topRight: {
    width: 60,
    alignItems: 'flex-end',
  },

  roundBubbleDark: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 40,
    paddingHorizontal: 10,
    paddingVertical: 10,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  topPillText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },

  avatarBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderColor: '#fff',
    borderWidth: 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a1a',
  },
  avatarInner: {
    width: 44,
    height: 44,
  },
  avatarBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ff2e2e',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    zIndex: 30,
  },
  avatarBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 10,
  },
});
