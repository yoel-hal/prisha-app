import { getApp, getApps, initializeApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import {
  browserLocalPersistence,
  getAuth,
  initializeAuth,
  type Auth,
} from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getFunctions, type Functions } from 'firebase/functions';
import { Platform } from 'react-native';

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
};

function assertFirebaseConfig(): void {
  const missing: string[] = [];
  if (!firebaseConfig.apiKey) missing.push('EXPO_PUBLIC_FIREBASE_API_KEY');
  if (!firebaseConfig.authDomain) missing.push('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN');
  if (!firebaseConfig.projectId) missing.push('EXPO_PUBLIC_FIREBASE_PROJECT_ID');
  if (!firebaseConfig.storageBucket) missing.push('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET');
  if (!firebaseConfig.messagingSenderId) {
    missing.push('EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID');
  }
  if (!firebaseConfig.appId) missing.push('EXPO_PUBLIC_FIREBASE_APP_ID');

  if (missing.length > 0) {
    throw new Error(
      `Missing Firebase environment variables: ${missing.join(', ')}. ` +
        'Copy .env.example to .env and fill in your Firebase project values.',
    );
  }
}

function getOrInitializeApp(): FirebaseApp {
  if (getApps().length > 0) {
    return getApp();
  }
  assertFirebaseConfig();
  return initializeApp(firebaseConfig);
}

function getOrInitializeAuth(firebaseApp: FirebaseApp): Auth {
  try {
    if (Platform.OS === 'web') {
      return initializeAuth(firebaseApp, {
        persistence: browserLocalPersistence,
      });
    }

    const { getReactNativePersistence } = require('firebase/auth');
    const ReactNativeAsyncStorage =
      require('@react-native-async-storage/async-storage').default;

    return initializeAuth(firebaseApp, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage),
    });
  } catch (error) {
    const code =
      error instanceof Error && 'code' in error
        ? (error as Error & { code: string }).code
        : undefined;
    if (code === 'auth/already-initialized') {
      return getAuth(firebaseApp);
    }
    throw error;
  }
}

const app = getOrInitializeApp();

export const auth: Auth = getOrInitializeAuth(app);
export const db: Firestore = getFirestore(app);
export const functions: Functions = getFunctions(app);

export { app };
