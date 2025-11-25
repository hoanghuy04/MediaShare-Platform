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
import { useAuth } from '@hooks/useAuth';
import { useTheme } from '@hooks/useTheme';
import { Input } from '@components/common/Input';
import { Button } from '@components/common/Button';
import { showAlert } from '@utils/helpers';
import {
  validateEmail,
  validateUsername,
  validatePassword,
  getEmailError,
  getUsernameError,
  getPasswordError,
} from '@utils/validators';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    username: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    const emailError = getEmailError(formData.email);
    const usernameError = getUsernameError(formData.username);
    const passwordError = getPasswordError(formData.password);

    if (emailError || usernameError || passwordError) {
      showAlert('Validation Error', emailError || usernameError || passwordError || '');
      return;
    }

    if (!formData.fullName) {
      showAlert('Error', 'Please enter your full name');
      return;
    }

    setIsLoading(true);
    try {
      await register(formData);
    } catch (error: any) {
      showAlert('Registration Failed', error.message || 'Failed to create account');
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
        <View style={styles.logoContainer}>
          <Text style={[styles.logo, { color: theme.colors.text }]}>Sudo</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Sign up to see photos and videos from your friends.
          </Text>
        </View>

        <View style={styles.formContainer}>
          <Input
            label="Email"
            value={formData.email}
            onChangeText={text => setFormData({ ...formData, email: text })}
            placeholder="Enter email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Input
            label="Full Name"
            value={formData.fullName}
            onChangeText={text => setFormData({ ...formData, fullName: text })}
            placeholder="Enter full name"
            autoCapitalize="words"
          />

          <Input
            label="Username"
            value={formData.username}
            onChangeText={text => setFormData({ ...formData, username: text })}
            placeholder="Enter username"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Input
            label="Password"
            value={formData.password}
            onChangeText={text => setFormData({ ...formData, password: text })}
            placeholder="Enter password"
            secureTextEntry
            autoCapitalize="none"
          />

          <Button
            title="Sign Up"
            onPress={handleRegister}
            loading={isLoading}
            style={styles.registerButton}
          />

          <View style={styles.loginContainer}>
            <Text style={[styles.loginText, { color: theme.colors.textSecondary }]}>
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={[styles.loginLink, { color: theme.colors.primary }]}>Log In</Text>
            </TouchableOpacity>
          </View>
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
    justifyContent: 'center',
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  formContainer: {
    width: '100%',
  },
  registerButton: {
    marginTop: 8,
    marginBottom: 16,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '600',
  },
});

