import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Animated,
  Dimensions,
  Share,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useUpload } from '@/context/UploadContext';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';

const { width } = Dimensions.get('window');
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export const UploadProgressWidget = ({ onRefreshFeed }: { onRefreshFeed: () => void }) => {
  const { uploadState, resetUpload, retryUpload } = useUpload();

  const progressAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const { user } = useAuth();

  useEffect(() => {
    if (uploadState.status === 'uploading') {
      const targetValue = uploadState.progress * width;

      Animated.timing(progressAnim, {
        toValue: targetValue,
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

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    if (uploadState.status === 'success') {
      timeout = setTimeout(() => {
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => {
          resetUpload();
          opacityAnim.setValue(1);
          progressAnim.setValue(0);
        });
      }, 5000);
    } else {
      opacityAnim.setValue(1);
    }

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [uploadState.status]);

  const handleSend = async () => {
    if (!uploadState.thumbnailUri) return;
    try {
      await Share.share({
        message: 'Check out my new post on MediaShare!',
        url: uploadState.thumbnailUri,
      });
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  if (uploadState.status === 'idle') return null;

  return (
    <Animated.View style={[styles.container, { opacity: opacityAnim }]}>
      {uploadState.status === 'uploading' && (
        <AnimatedLinearGradient
          colors={['#FEDA75', '#FA7E1E', '#D62976', '#962FBF', '#4F5BD5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.progressBar, { width: progressAnim }]}
        />
      )}

      <View style={styles.contentRow}>
        <Image
          source={{ uri: uploadState.thumbnailUri || '' }}
          style={styles.thumbnail}
          resizeMode="cover"
        />

        <View style={styles.textContainer}>
          {uploadState.status === 'uploading' ? (
            <Text style={styles.statusText}>Đang đăng lên {user?.username}...</Text>
          ) : uploadState.status === 'success' ? (
            <>
              <Text style={styles.successTitle}>Đã đăng! Xong cả rồi.</Text>
              <Text style={styles.successSub}>Bạn muốn gửi cho bạn bè?</Text>
            </>
          ) : (
            <View>
              <Text style={[styles.statusText, { color: 'red' }]}>Đăng thất bại. Thử lại?</Text>
              {uploadState.errorMessage && (
                <Text style={{ fontSize: 11, color: '#ff4444', marginTop: 2 }} numberOfLines={1}>
                  {uploadState.errorMessage}
                </Text>
              )}
            </View>
          )}
        </View>

        {uploadState.status === 'success' ? (
          <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
            <Text style={styles.sendBtnText}>Gửi</Text>
          </TouchableOpacity>
        ) : uploadState.status === 'error' ? (
          <TouchableOpacity onPress={retryUpload} style={styles.retryBtn}>
            <Ionicons name="refresh" size={24} color="#000" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#efefef',
    position: 'relative',
    overflow: 'hidden',
    height: 80,
    justifyContent: 'center',
  },
  progressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 2,
    zIndex: 10,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    height: '100%',
  },
  thumbnail: {
    width: 36,
    height: 64,
    borderRadius: 4,
    marginRight: 12,
    backgroundColor: '#262626',
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    height: '100%',
  },
  statusText: {
    fontSize: 14,
    color: '#262626',
  },
  successTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#262626',
  },
  successSub: {
    fontSize: 12,
    color: '#0095f6',
    marginTop: 2,
  },
  sendBtn: {
    backgroundColor: '#0095f6',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 4,
    marginLeft: 8,
  },
  sendBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  retryBtn: {
    padding: 8,
  },
  loadingDot: {},
});
