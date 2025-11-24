import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@hooks/useTheme';
import { Input } from '@components/common/Input';
import { Button } from '@components/common/Button';
import { authAPI } from '@services/auth.service';
import { showAlert } from '@utils/helpers';
import { validateEmail } from '@utils/validators';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!validateEmail(email)) {
      showAlert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      await authAPI.forgotPassword(email);
      setIsSuccess(true);
      showAlert(
        'Email Sent',
        'Password reset instructions have been sent to your email.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      showAlert('Error', error.message || 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={[styles.backText, { color: theme.colors.primary }]}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.content}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Forgot Password?</Text>
          <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
            Enter your email address and we'll send you instructions to reset your password.
          </Text>

          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Button title="Send Reset Link" onPress={handleSubmit} loading={isLoading} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  backButton: {
    marginBottom: 24,
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 32,
  },
});

