import * as AppleAuthentication from 'expo-apple-authentication';
import {
  AccessTokenRequest,
  AuthRequest,
  makeRedirectUri,
  ResponseType,
  type AuthSessionResult,
} from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import * as Application from 'expo-application';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import { FirebaseError } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  GoogleAuthProvider,
  OAuthProvider,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type Unsubscribe,
  type User,
} from 'firebase/auth';
import { Platform } from 'react-native';

import { auth } from './config';

WebBrowser.maybeCompleteAuthSession();

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

export function onAuthStateChanged(
  callback: (user: User | null) => void,
): Unsubscribe {
  return firebaseOnAuthStateChanged(auth, callback);
}

const GOOGLE_WEB_CLIENT_ID_ENV = 'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID';
const GOOGLE_IOS_CLIENT_ID_ENV = 'EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID';
const GOOGLE_ANDROID_CLIENT_ID_ENV = 'EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID';

const GOOGLE_SCOPES = [
  'openid',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
];

function toErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
}

function isCancelledError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  const code = (error as Error & { code?: string }).code;
  return (
    code === 'ERR_REQUEST_CANCELED' ||
    code === 'SIGN_IN_CANCELLED' ||
    code === 'ERR_CANCELED'
  );
}

function isCancelledAuthSession(result: AuthSessionResult): boolean {
  return result.type === 'cancel' || result.type === 'dismiss';
}

async function sha256(value: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value);
}

function createRandomNonce(length = 32): string {
  const charset =
    '0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._';
  const randomBytes = Crypto.getRandomBytes(length);
  return Array.from(
    randomBytes,
    (byte) => charset[byte % charset.length],
  ).join('');
}

function getGoogleClientId(): string | null {
  const webClientId = process.env[GOOGLE_WEB_CLIENT_ID_ENV];
  const iosClientId = process.env[GOOGLE_IOS_CLIENT_ID_ENV];
  const androidClientId = process.env[GOOGLE_ANDROID_CLIENT_ID_ENV];

  return (
    Platform.select({
      ios: iosClientId ?? webClientId,
      android: androidClientId ?? webClientId,
      default: webClientId,
    }) ?? null
  );
}

async function resolveGoogleIdToken(
  clientId: string,
  redirectUri: string,
  request: AuthRequest,
  params: Record<string, string>,
): Promise<string | null> {
  if (params.id_token) {
    return params.id_token;
  }

  const code = params.code;
  if (!code) {
    return null;
  }

  const exchangeRequest = new AccessTokenRequest({
    clientId,
    redirectUri,
    scopes: GOOGLE_SCOPES,
    code,
    extraParams: {
      code_verifier: request.codeVerifier ?? '',
    },
  });

  const authentication = await exchangeRequest.performAsync(Google.discovery);
  return authentication.idToken ?? null;
}

export async function signInWithGoogle(): Promise<AuthResult> {
  try {
    const clientId = getGoogleClientId();
    if (!clientId) {
      return {
        success: false,
        error: `Google client ID is not configured (${GOOGLE_WEB_CLIENT_ID_ENV})`,
      };
    }

    const redirectUri =
      makeRedirectUri({
        native: `${Application.applicationId}:/oauthredirect`,
      }) ?? makeRedirectUri();

    const isWeb = Platform.OS === 'web';
    const responseType = isWeb ? ResponseType.IdToken : ResponseType.Code;

    const request = new AuthRequest({
      clientId,
      redirectUri,
      scopes: GOOGLE_SCOPES,
      responseType,
      usePKCE: responseType === ResponseType.Code,
    });

    await request.makeAuthUrlAsync(Google.discovery);

    const authResult = await request.promptAsync(Google.discovery, {
      windowFeatures: { width: 515, height: 680 },
    });

    if (isCancelledAuthSession(authResult)) {
      return { success: false, error: 'Sign in was cancelled' };
    }

    if (authResult.type === 'error') {
      return {
        success: false,
        error: authResult.error?.message ?? 'Google Sign-In failed',
      };
    }

    if (authResult.type !== 'success') {
      return { success: false, error: 'Google Sign-In failed' };
    }

    const idToken = await resolveGoogleIdToken(
      clientId,
      redirectUri,
      request,
      authResult.params,
    );

    if (!idToken) {
      return {
        success: false,
        error: 'No ID token returned from Google Sign-In',
      };
    }

    const credential = GoogleAuthProvider.credential(idToken);
    const userCredential = await signInWithCredential(auth, credential);
    return { success: true, user: userCredential.user };
  } catch (error) {
    if (isCancelledError(error)) {
      return { success: false, error: 'Sign in was cancelled' };
    }
    return { success: false, error: toErrorMessage(error) };
  }
}

export async function signInWithApple(): Promise<AuthResult> {
  try {
    if (Platform.OS !== 'ios') {
      return {
        success: false,
        error: 'Apple Sign-In is only available on iOS',
      };
    }

    const isAvailable = await AppleAuthentication.isAvailableAsync();
    if (!isAvailable) {
      return {
        success: false,
        error: 'Apple Sign-In is not available on this device',
      };
    }

    const rawNonce = createRandomNonce();
    const hashedNonce = await sha256(rawNonce);

    const appleCredential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });

    if (!appleCredential.identityToken) {
      return {
        success: false,
        error: 'No identity token returned from Apple Sign-In',
      };
    }

    const provider = new OAuthProvider('apple.com');
    const credential = provider.credential({
      idToken: appleCredential.identityToken,
      rawNonce,
    });
    const userCredential = await signInWithCredential(auth, credential);
    return { success: true, user: userCredential.user };
  } catch (error) {
    if (isCancelledError(error)) {
      return { success: false, error: 'Sign in was cancelled' };
    }
    return { success: false, error: toErrorMessage(error) };
  }
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<AuthResult> {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password,
    );
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: toErrorMessage(error) };
  }
}

export async function registerWithEmail(
  email: string,
  password: string,
): Promise<AuthResult> {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: toErrorMessage(error) };
  }
}

export async function sendPasswordReset(email: string): Promise<AuthResult> {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    return { success: false, error: toErrorMessage(error) };
  }
}

export async function signOut(): Promise<AuthResult> {
  try {
    await firebaseSignOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: toErrorMessage(error) };
  }
}

export class RequiresReauthError extends Error {
  constructor() {
    super('REQUIRES_REAUTH');
    this.name = 'RequiresReauthError';
  }
}

export class WrongPasswordError extends Error {
  constructor() {
    super('WRONG_PASSWORD');
    this.name = 'WrongPasswordError';
  }
}

export function isEmailPasswordUser(): boolean {
  return auth.currentUser?.providerData[0]?.providerId === 'password';
}

export async function reauthenticateWithPassword(password: string): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser?.email) {
    throw new Error('No authenticated user with email');
  }

  const credential = EmailAuthProvider.credential(currentUser.email, password);

  try {
    await reauthenticateWithCredential(currentUser, credential);
  } catch (error) {
    if (
      error instanceof FirebaseError &&
      (error.code === 'auth/wrong-password' ||
        error.code === 'auth/invalid-credential' ||
        error.code === 'auth/invalid-login-credentials')
    ) {
      throw new WrongPasswordError();
    }
    throw error;
  }
}

export async function deleteUserAccount(): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('No authenticated user');
  }

  try {
    await currentUser.delete();
  } catch (error) {
    if (
      error instanceof FirebaseError &&
      error.code === 'auth/requires-recent-login'
    ) {
      throw new RequiresReauthError();
    }
    throw error;
  }
}
