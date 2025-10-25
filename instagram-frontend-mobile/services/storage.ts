import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SECURE_KEYS = {
  AUTH_TOKEN: 'authToken',
  REFRESH_TOKEN: 'refreshToken',
} as const;

const STORAGE_KEYS = {
  USER_DATA: 'userData',
  THEME: 'theme',
  LANGUAGE: 'language',
  ONBOARDING_COMPLETED: 'onboardingCompleted',
  RECENT_SEARCHES: 'recentSearches',
} as const;

// Secure storage (for sensitive data like tokens)
export const secureStorage = {
  async setToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(SECURE_KEYS.AUTH_TOKEN, token);
  },

  async getToken(): Promise<string | null> {
    return await SecureStore.getItemAsync(SECURE_KEYS.AUTH_TOKEN);
  },

  async removeToken(): Promise<void> {
    await SecureStore.deleteItemAsync(SECURE_KEYS.AUTH_TOKEN);
  },

  async setRefreshToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(SECURE_KEYS.REFRESH_TOKEN, token);
  },

  async getRefreshToken(): Promise<string | null> {
    return await SecureStore.getItemAsync(SECURE_KEYS.REFRESH_TOKEN);
  },

  async removeRefreshToken(): Promise<void> {
    await SecureStore.deleteItemAsync(SECURE_KEYS.REFRESH_TOKEN);
  },

  async clearAll(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync(SECURE_KEYS.AUTH_TOKEN),
      SecureStore.deleteItemAsync(SECURE_KEYS.REFRESH_TOKEN),
    ]);
  },
};

// Regular storage (for non-sensitive data)
export const storage = {
  async setItem(key: string, value: any): Promise<void> {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
  },

  async getItem<T>(key: string): Promise<T | null> {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  },

  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  },

  async clearAll(): Promise<void> {
    await AsyncStorage.clear();
  },

  async setUserData(data: any): Promise<void> {
    await this.setItem(STORAGE_KEYS.USER_DATA, data);
  },

  async getUserData<T>(): Promise<T | null> {
    return await this.getItem<T>(STORAGE_KEYS.USER_DATA);
  },

  async removeUserData(): Promise<void> {
    await this.removeItem(STORAGE_KEYS.USER_DATA);
  },

  async setTheme(theme: 'light' | 'dark' | 'auto'): Promise<void> {
    await this.setItem(STORAGE_KEYS.THEME, theme);
  },

  async getTheme(): Promise<'light' | 'dark' | 'auto' | null> {
    return await this.getItem<'light' | 'dark' | 'auto'>(STORAGE_KEYS.THEME);
  },

  async setOnboardingCompleted(completed: boolean): Promise<void> {
    await this.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, completed);
  },

  async getOnboardingCompleted(): Promise<boolean> {
    const completed = await this.getItem<boolean>(STORAGE_KEYS.ONBOARDING_COMPLETED);
    return completed ?? false;
  },

  async setRecentSearches(searches: string[]): Promise<void> {
    await this.setItem(STORAGE_KEYS.RECENT_SEARCHES, searches);
  },

  async getRecentSearches(): Promise<string[] | null> {
    return await this.getItem<string[]>(STORAGE_KEYS.RECENT_SEARCHES);
  },

  async clearRecentSearches(): Promise<void> {
    await this.removeItem(STORAGE_KEYS.RECENT_SEARCHES);
  },
};

export default {
  ...secureStorage,
  ...storage,
};

