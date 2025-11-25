import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { messageAPI } from '../../services/message.service';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { showAlert } from '../../utils/helpers';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PENDING_JOIN_TOKEN_KEY = 'pending_join_token';

export default function JoinConversationScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const params = useLocalSearchParams<{ token: string }>();
  const token = Array.isArray(params.token) ? params.token[0] : params.token;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const joinConversation = async () => {
      if (!token) {
        setError('Token không hợp lệ');
        setLoading(false);
        return;
      }

      // Check if user is authenticated
      if (!isAuthenticated || !user) {
        // Save token for later use after login
        await AsyncStorage.setItem(PENDING_JOIN_TOKEN_KEY, token);
        setError('Bạn cần đăng nhập để tham gia nhóm');
        setLoading(false);
        // Redirect to login
        setTimeout(() => {
          router.replace({
            pathname: '/(auth)/login',
            params: { returnUrl: `/join/${token}` },
          });
        }, 2000);
        return;
      }

      // User is authenticated, try to join
      try {
        setLoading(true);
        const conversation = await messageAPI.joinByInviteToken(token);
        
        // Clear pending token if exists
        await AsyncStorage.removeItem(PENDING_JOIN_TOKEN_KEY);
        
        // Success - redirect to conversation
        showAlert('Thành công', 'Bạn đã tham gia nhóm thành công');
        setTimeout(() => {
          router.replace(`/messages/${conversation.id}`);
        }, 500);
      } catch (error: any) {
        console.error('Error joining conversation:', error);
        const errorMessage = error?.response?.data?.message || 
                           error?.message || 
                           'Không thể tham gia nhóm. Liên kết có thể đã hết hạn hoặc không hợp lệ.';
        setError(errorMessage);
        setLoading(false);
        // Clear pending token on error
        await AsyncStorage.removeItem(PENDING_JOIN_TOKEN_KEY);
      }
    };

    joinConversation();
  }, [token, isAuthenticated, user, router]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        {loading ? (
          <>
            <LoadingSpinner />
            <Text style={[styles.message, { color: theme.colors.text }]}>
              Đang tham gia nhóm...
            </Text>
          </>
        ) : error ? (
          <>
            <View style={styles.errorIcon}>
              <Text style={styles.errorEmoji}>⚠️</Text>
            </View>
            <Text style={[styles.errorTitle, { color: theme.colors.text }]}>
              Không thể tham gia nhóm
            </Text>
            <Text style={[styles.errorMessage, { color: theme.colors.textSecondary }]}>
              {error}
            </Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.backButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => {
                  if (router.canGoBack()) {
                    router.back();
                  } else {
                    router.replace('/(tabs)/messages');
                  }
                }}
              >
                <Text style={[styles.backButtonText, { color: 'white' }]}>
                  Quay lại
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  message: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  errorIcon: {
    marginBottom: 16,
  },
  errorEmoji: {
    fontSize: 64,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  buttonContainer: {
    marginTop: 16,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

