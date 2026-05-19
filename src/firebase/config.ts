import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { getApp, getApps, initializeApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  type Auth,
  // @ts-expect-error Exported from the React Native bundle; Metro resolves it at build time.
  getReactNativePersistence,
} from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getFunctions, type Functions } from 'firebase/functions';

const FIREBASE_ENV_KEYS = {
  apiKey: 'EXPO_PUBLIC_FIREBASE_API_KEY',
  authDomain: 'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
  projectId: 'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  storageBucket: 'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'EXPO_PUBLIC_FIREBASE_APP_ID',
} as const;

function readEnv(key: string): string | undefined {
  const fromProcess = process.env[key];
  if (fromProcess) {
    return fromProcess;
  }

  const extra = Constants.expoConfig?.extra;
  if (extra && typeof extra === 'object' && key in extra) {
    const value = extra[key as keyof typeof extra];
    return typeof value === 'string' ? value : undefined;
  }

  return undefined;
}

function buildFirebaseConfig(): FirebaseOptions {
  const config: Record<keyof typeof FIREBASE_ENV_KEYS, string> = {
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
  };

  const missing: string[] = [];

  for (const [field, envKey] of Object.entries(FIREBASE_ENV_KEYS) as Array<
    [keyof typeof FIREBASE_ENV_KEYS, string]
  >) {
    const value = readEnv(envKey);
    if (!value) {
      missing.push(envKey);
    } else {
      config[field] = value;
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing Firebase environment variables: ${missing.join(', ')}. ` +
        'Copy .env.example to .env and fill in your Firebase project values.',
    );
  }

  return config;
}

function getOrInitializeApp(): FirebaseApp {
  if (getApps().length > 0) {
    return getApp();
  }
  return initializeApp(buildFirebaseConfig());
}

function getOrInitializeAuth(firebaseApp: FirebaseApp): Auth {
  try {
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
