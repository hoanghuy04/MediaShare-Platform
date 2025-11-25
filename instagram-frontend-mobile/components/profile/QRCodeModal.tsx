import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Share,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@hooks/useTheme';
import { Avatar } from '../common/Avatar';

const { width } = Dimensions.get('window');
const QR_SIZE = width * 0.6;

interface QRCodeModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
  username: string;
  fullName?: string;
  avatar?: string;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  visible,
  onClose,
  userId,
  username,
  fullName,
  avatar,
}) => {
  const { theme } = useTheme();
  // Format: instagram://user/{userId} hoặc https://yourdomain.com/users/{userId}
  const qrData = `instagram://user/${userId}`;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Theo dõi tôi trên Instagram: @${username}\n${qrData}`,
        title: 'Chia sẻ trang cá nhân',
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleCopyLink = () => {
    // Implement copy to clipboard
    console.log('Copy link:', qrData);
  };

  const handleDownload = () => {
    // Implement download QR code
    console.log('Download QR code');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              {username.toUpperCase()}
            </Text>
            <View style={{ width: 28 }} />
          </View>

          {/* QR Code Card */}
          <View style={styles.qrCard}>
            <LinearGradient
              colors={['#FEDA75', '#FA7E1E', '#D62976', '#962FBF', '#4F5BD5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientBorder}
            >
              <View style={[styles.qrContent, { backgroundColor: theme.colors.background }]}>
                {/* User Info */}
                <View style={styles.userInfo}>
                  <Avatar uri={avatar} name={username} size={80} />
                  <Text style={[styles.username, { color: theme.colors.text }]}>
                    {username}
                  </Text>
                  {fullName && (
                    <Text style={[styles.fullName, { color: theme.colors.textSecondary }]}>
                      {fullName}
                    </Text>
                  )}
                </View>

                {/* QR Code */}
                <View style={styles.qrWrapper}>
                  <QRCode
                    value={qrData}
                    size={QR_SIZE}
                    color="#000000"
                    backgroundColor="#FFFFFF"
                    logo={avatar ? { uri: avatar } : undefined}
                    logoSize={QR_SIZE * 0.2}
                    logoBackgroundColor="white"
                    logoBorderRadius={QR_SIZE * 0.1}
                  />
                </View>

                {/* Instructions */}
                <View style={styles.instructions}>
                  <Ionicons name="camera-outline" size={24} color={theme.colors.textSecondary} />
                  <Text style={[styles.instructionText, { color: theme.colors.textSecondary }]}>
                    Đây là bạn!
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.card }]}
              onPress={handleShare}
            >
              <Ionicons name="share-outline" size={24} color={theme.colors.text} />
              <Text style={[styles.actionText, { color: theme.colors.text }]}>
                Chia sẻ trang cá nhân
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.card }]}
              onPress={handleCopyLink}
            >
              <Ionicons name="link-outline" size={24} color={theme.colors.text} />
              <Text style={[styles.actionText, { color: theme.colors.text }]}>
                Sao chép liên kết
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.card }]}
              onPress={handleDownload}
            >
              <Ionicons name="download-outline" size={24} color={theme.colors.text} />
              <Text style={[styles.actionText, { color: theme.colors.text }]}>
                Tải xuống
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    paddingBottom: 32,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1,
  },
  qrCard: {
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 20,
  },
  gradientBorder: {
    padding: 3,
    borderRadius: 24,
  },
  qrContent: {
    borderRadius: 21,
    padding: 24,
    alignItems: 'center',
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  username: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
  },
  fullName: {
    fontSize: 14,
    marginTop: 4,
  },
  qrWrapper: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  instructions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
  },
  instructionText: {
    fontSize: 14,
  },
  actions: {
    paddingHorizontal: 20,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 12,
  },
  actionText: {
    fontSize: 15,
    fontWeight: '500',
  },
});
