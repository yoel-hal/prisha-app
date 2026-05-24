const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  '@/store': path.resolve(__dirname, 'src/store'),
  '@/hooks': path.resolve(__dirname, 'src/hooks'),
  '@/firebase': path.resolve(__dirname, 'src/firebase'),
  '@/calculations': path.resolve(__dirname, 'src/calculations'),
  '@/utils': path.resolve(__dirname, 'src/utils'),
  '@/components': path.resolve(__dirname, 'src/components'),
  '@/i18n': path.resolve(__dirname, 'src/i18n'),
};

module.exports = config;
