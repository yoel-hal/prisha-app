module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['.'],
          alias: {
            '@/store': './src/store',
            '@/hooks': './src/hooks',
            '@/firebase': './src/firebase',
            '@/calculations': './src/calculations',
            '@/utils': './src/utils',
            '@/components': './src/components',
            '@/i18n': './src/i18n',
          },
          extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
