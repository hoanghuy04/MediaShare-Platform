import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
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

      // Auto-add userId/senderId/followerId to query params for endpoints that need it
      // This is a workaround - ideally backend should extract userId from JWT token
      const userDataStr = await AsyncStorage.getItem('userData');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        const userId = userData.id;

        // Initialize params if not exist
        config.params = config.params || {};

        // Get method and URL
        const method = config.method?.toUpperCase();
        const url = config.url || '';

        // Endpoints that need userId (for all HTTP methods)
        const needsUserId =
          url.includes('/posts') ||
          url.includes('/comments') ||
          url.includes('/upload') ||
          url.includes('/notifications') ||
          url.includes('/auth/logout');

        if (needsUserId && !config.params.userId) {
          config.params.userId = userId;
        }

        // Endpoints that need senderId (specifically for messages)
        if (url.includes('/messages')) {
          // GET /messages needs userId for getConversations and getConversation
          if (method === 'GET' && !config.params.userId) {
            config.params.userId = userId;
          }
          // POST /messages needs senderId for sendMessage
          if (method === 'POST' && !config.params.senderId) {
            config.params.senderId = userId;
          }
        }

        // Endpoints that need followerId
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
      // Handle unauthorized - clear token and redirect to login
      try {
        await SecureStore.deleteItemAsync('authToken');
        // Navigation to login will be handled by context
      } catch (e) {
        console.error('Error clearing auth token:', e);
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
