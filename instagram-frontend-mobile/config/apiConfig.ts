import Constants from 'expo-constants';

// Get environment configuration from app.json
const getEnvVars = () => {
  const extra = Constants.expoConfig?.extra;
  const releaseChannel = extra?.releaseChannel;

  // Use environment-specific config from app.json
  if (__DEV__) {
    return (
      extra?.dev || {
        apiUrl: 'http://192.168.185.1:8080',
        wsUrl: 'ws://192.168.185.1:8080',
      }
    );
  } else if (releaseChannel === 'production') {
    return (
      extra?.prod || {
        apiUrl: 'http://192.168.185.1:8080',
        wsUrl: 'ws://192.168.185.1:8080',
      }
    );
  } else {
    return (
      extra?.dev || {
        apiUrl: 'http://192.168.185.1:8080',
        wsUrl: 'ws://192.168.185.1:8080',
      }
    );
  }
};

export default getEnvVars();
