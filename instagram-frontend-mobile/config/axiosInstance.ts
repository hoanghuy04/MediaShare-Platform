import axios, { AxiosError, AxiosResponse } from 'axios';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiConfig from './apiConfig';

const axiosInstance = axios.create({
  baseURL: apiConfig.apiUrl,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
axiosInstance.interceptors.request.use(
  async (config: any) => {
    try {
      // Add Authorization token
      const token = await SecureStore.getItemAsync('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      const userDataStr = await AsyncStorage.getItem('userData');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        const userId = userData.id;

        // Initialize params if not exist
        config.params = config.params || {};

        const method = config.method?.toUpperCase();
        const url = config.url || '';

        // Endpoints khác vẫn cần userId (tùy backend hiện tại)
        const needsUserId =
          url.includes('/posts') ||
          url.includes('/comments') ||
          url.includes('/upload') ||
          url.includes('/notifications') ||
          url.includes('/auth/logout');

        if (needsUserId && !config.params.userId) {
          config.params.userId = userId;
        }

        if (url.includes('/follow') && (method === 'POST' || method === 'DELETE')) {
          if (!config.params.followerId) {
            config.params.followerId = userId;
          }
        }
      }
    } catch (error) {
      console.error('Error in request interceptor:', error);
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      try {
        await SecureStore.deleteItemAsync('authToken');
      } catch (e) {
        console.error('Error clearing auth token:', e);
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
