import Constants from 'expo-constants';

// Get environment configuration from app.json
const getEnvVars = () => {
  const extra = Constants.expoConfig?.extra;
  const releaseChannel = extra?.releaseChannel;
  
  console.log('🔧 Config Debug - extra:', extra);
  console.log('🔧 Config Debug - releaseChannel:', releaseChannel);

  // Use environment-specific config from app.json
  if (__DEV__) {
    const config = extra?.dev || {
      apiUrl: 'http://192.168.100.2:8080',
      wsUrl: 'http://192.168.100.2:8080', 
    };
    console.log('🔧 Config Debug - DEV config:', config);
    return config;
  } else if (releaseChannel === 'production') {
    const config = extra?.prod || {
      apiUrl: 'http://192.168.100.2:8080',
      wsUrl: 'http://192.168.100.2:8080', 
    };
    console.log('🔧 Config Debug - PROD config:', config);
    return config;
  } else {
    const config = extra?.dev || {
      apiUrl: 'http://192.168.100.2:8080',
      wsUrl: 'http://192.168.100.2:8080', 
    };
    console.log('🔧 Config Debug - DEFAULT config:', config);
    return config;
  }
};

export default getEnvVars();
