import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Helper to get the correct localhost URL based on platform
const getLocalApiUrl = () => {
  if (Platform.OS === 'android') {
    // Android emulator uses 10.0.2.2 to access host machine's localhost
    return 'http://localhost:8080';
  } else if (Platform.OS === 'ios') {
    // iOS simulator can use localhost
    return 'http://localhost:8080';
  } else {
    // Web
    return 'http://localhost:8080';
  }
};

const ENV = {
  dev: {
    apiUrl: 'http://localhost:8080',
    wsUrl: 'ws://localhost:8080',
  },
  prod: {
    apiUrl: 'https://your-production-api.com',
    wsUrl: 'wss://your-production-api.com',
  },
};

const getEnvVars = () => {
  const releaseChannel = Constants.expoConfig?.extra?.releaseChannel;
  
  if (__DEV__) {
    return ENV.dev;
  } else if (releaseChannel === 'production') {
    return ENV.prod;
  } else {
    return ENV.dev;
  }
};

export default getEnvVars();

