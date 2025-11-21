module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './',
            '@components': './components',
            '@hooks': './hooks',
            '@services': './services',
            '@utils': './utils',
            '@types': './types',
            '@config': './config',
            '@context': './context',
            '@store': './store',
            '@styles': './styles',
          },
        },
      ],

      'react-native-reanimated/plugin',
    ],
  };
};
