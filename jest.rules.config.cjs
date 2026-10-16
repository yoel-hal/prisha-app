/** Firestore security rules tests; run via `npm run test:rules` (needs the emulator). */
/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo/node',
  roots: ['<rootDir>/rules-tests'],
  testMatch: ['**/*.test.ts'],
  testTimeout: 20000,
};
