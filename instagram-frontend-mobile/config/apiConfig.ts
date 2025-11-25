import Constants from 'expo-constants';

const getEnvVars = () => {
  const extra = Constants.expoConfig?.extra;
  const releaseChannel = extra?.releaseChannel;

  if (__DEV__) {
    return extra?.dev;
  }

  if (releaseChannel === 'production') {
    return extra?.prod;
  }

  return extra?.dev;
};

export default getEnvVars();
