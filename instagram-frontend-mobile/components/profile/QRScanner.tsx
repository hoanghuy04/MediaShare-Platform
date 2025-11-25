import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Modal,
  Alert,
} from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@hooks/useTheme';

const { width, height } = Dimensions.get('window');
const SCAN_AREA_SIZE = width * 0.7;

interface QRScannerProps {
  visible: boolean;
  onClose: () => void;
  onScanSuccess?: (userId: string) => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({
  visible,
  onClose,
  onScanSuccess,
}) => {
  const { theme } = useTheme();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  // Reset scanned state when modal is opened
  useEffect(() => {
    if (visible) {
      setScanned(false);
    }
  }, [visible]);

  const handleBarCodeScanned = ({ data }: { type: string; data: string }) => {
    if (scanned) return;
    
    setScanned(true);
    
    // Parse QR code data
    // Expected formats: instagram://user/<userId> or https://domain.com/users/<userId>
    let userId: string | null = null;
    
    // Try deep link format: instagram://user/{userId}
    const deepLinkMatch = data.match(/instagram:\/\/user\/(.+)/);
    if (deepLinkMatch && deepLinkMatch[1]) {
      userId = deepLinkMatch[1];
    } else {
      // Try web URL format: https://domain.com/users/{userId}
      const webMatch = data.match(/\/users\/(.+)/);
      if (webMatch && webMatch[1]) {
        userId = webMatch[1];
      }
    }
    
    if (userId) {
      // Close scanner and show user preview modal
      onClose();
      onScanSuccess?.(userId);
    } else {
      Alert.alert(
        'Mã QR không hợp lệ',
        'Mã QR này không phải là mã trang cá nhân Instagram.',
        [{ text: 'OK', onPress: () => setScanned(false) }]
      );
    }
  };

  const toggleTorch = () => {
    setTorchEnabled(!torchEnabled);
  };

  if (hasPermission === null) {
    return null;
  }

  if (hasPermission === false) {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <View style={styles.permissionContainer}>
            <Ionicons name="camera-outline" size={64} color={theme.colors.textSecondary} />
            <Text style={[styles.permissionText, { color: theme.colors.text }]}>
              Không có quyền truy cập camera
            </Text>
            <Text style={[styles.permissionSubtext, { color: theme.colors.textSecondary }]}>
              Vui lòng cấp quyền camera trong cài đặt
            </Text>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: theme.colors.primary }]}
              onPress={onClose}
            >
              <Text style={styles.closeButtonText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        <CameraView
          style={styles.camera}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
        >
          {/* Overlay */}
          <View style={styles.overlay}>
            {/* Top */}
            <View style={styles.overlayTop}>
              <View style={styles.header}>
                <TouchableOpacity onPress={onClose} style={styles.headerButton}>
                  <Ionicons name="close" size={28} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Quét mã QR</Text>
                <TouchableOpacity onPress={toggleTorch} style={styles.headerButton}>
                  <Ionicons 
                    name={torchEnabled ? "flash" : "flash-off"} 
                    size={24} 
                    color="white" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Scan Area */}
            <View style={styles.scanAreaContainer}>
              <View style={styles.scanAreaRow}>
                <View style={styles.overlaySection} />
                <View style={styles.scanArea}>
                  {/* Corner brackets */}
                  <View style={[styles.corner, styles.cornerTopLeft]} />
                  <View style={[styles.corner, styles.cornerTopRight]} />
                  <View style={[styles.corner, styles.cornerBottomLeft]} />
                  <View style={[styles.corner, styles.cornerBottomRight]} />
                  
                  {/* Scanning line animation would go here */}
                </View>
                <View style={styles.overlaySection} />
              </View>
            </View>

            {/* Bottom */}
            <View style={styles.overlayBottom}>
              <Text style={styles.instructionText}>
                Đưa mã QR vào khung để quét
              </Text>
            </View>
          </View>
        </CameraView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
  },
  overlayTop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  scanAreaContainer: {
    height: SCAN_AREA_SIZE,
  },
  scanAreaRow: {
    flex: 1,
    flexDirection: 'row',
  },
  overlaySection: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  scanArea: {
    width: SCAN_AREA_SIZE,
    height: SCAN_AREA_SIZE,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: 'white',
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 8,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 8,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 8,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 8,
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  instructionText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  permissionText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  permissionSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  closeButton: {
    marginTop: 16,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
