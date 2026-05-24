/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  moduleNameMapper: {
    '^@/store$': '<rootDir>/src/store/index.ts',
    '^@/store/(.*)$': '<rootDir>/src/store/$1',
    '^@/hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@/firebase/(.*)$': '<rootDir>/src/firebase/$1',
    '^@/calculations/(.*)$': '<rootDir>/src/calculations/$1',
    '^@/utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/i18n/(.*)$': '<rootDir>/src/i18n/$1',
  },
  testMatch: ['**/__tests__/**/*.test.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|@hebcal/)',
  ],
};
