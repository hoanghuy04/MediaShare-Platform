import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { useUpload } from '@/context/UploadContext';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export const UploadProgressWidget = ({ onRefreshFeed }: { onRefreshFeed: () => void }) => {
  const { uploadState, resetUpload } = useUpload();
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (uploadState.status === 'uploading') {
      Animated.timing(progressAnim, {
        toValue: uploadState.progress * width,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else if (uploadState.status === 'success') {
      Animated.timing(progressAnim, {
        toValue: width,
        duration: 200,
        useNativeDriver: false,
      }).start(() => {
        onRefreshFeed();
      });
    }
  }, [uploadState.progress, uploadState.status]);

  if (uploadState.status === 'idle') return null;

  return (
    <View style={styles.container}>
      {uploadState.status === 'uploading' && (
        <Animated.View style={[styles.progressBar, { width: progressAnim }]} />
      )}

      <View style={styles.contentRow}>
        <Image source={{ uri: uploadState.thumbnailUri || '' }} style={styles.thumbnail} />

        <View style={styles.textContainer}>
          {uploadState.status === 'uploading' ? (
            <Text style={styles.statusText}>Đang đăng lên...</Text>
          ) : uploadState.status === 'success' ? (
            <>
              <Text style={styles.successTitle}>Đã đăng! Xong cả rồi.</Text>
              <Text style={styles.successSub}>Bạn muốn gửi cho bạn bè?</Text>
            </>
          ) : (
            <Text style={[styles.statusText, { color: 'red' }]}>Đăng thất bại. Thử lại?</Text>
          )}
        </View>

        {uploadState.status === 'success' ? (
          <TouchableOpacity style={styles.sendBtn}>
            <Text style={styles.sendBtnText}>Gửi</Text>
          </TouchableOpacity>
        ) : uploadState.status === 'error' ? (
          <TouchableOpacity onPress={resetUpload}>
            <Ionicons name="refresh" size={24} color="#000" />
          </TouchableOpacity>
        ) : (
          <View style={styles.loadingDot} />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#efefef',
    position: 'relative',
    overflow: 'hidden',
  },
  progressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 2,
    backgroundColor: '#3BADF8',
    zIndex: 10,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  thumbnail: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginRight: 12,
    backgroundColor: '#eee',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 14,
    color: '#262626',
  },
  successTitle: {
    fontSize: 14,
    fontWeight: '600', // Semi-bold
    color: '#262626',
  },
  successSub: {
    fontSize: 12,
    color: '#8e8e8e',
    marginTop: 2,
  },
  sendBtn: {
    backgroundColor: '#0095f6',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 4,
  },
  sendBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  loadingDot: {},
});
