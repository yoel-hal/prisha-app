import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import type { AppLockType } from '../store/authStore';

export const APP_LOCK_PIN_HASH_KEY = 'app_lock_pin_hash';
/** @deprecated Legacy plaintext key — migrated on read */
const LEGACY_APP_LOCK_PIN_KEY = 'app_lock_pin';
export const APP_LOCK_ENABLED_KEY = 'app_lock_enabled';
export const APP_LOCK_TYPE_KEY = 'app_lock_type';

const PIN_LENGTH = 4;

export async function hashAppLockPin(pin: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, pin);
}

async function secureGet(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

async function secureSet(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function secureDelete(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

function isLegacyPlaintextPin(value: string): boolean {
  return value.length === PIN_LENGTH && /^\d+$/.test(value);
}

async function readStoredPinHash(): Promise<string | null> {
  const hash = await secureGet(APP_LOCK_PIN_HASH_KEY);
  if (hash) {
    return hash;
  }

  const legacy = await secureGet(LEGACY_APP_LOCK_PIN_KEY);
  if (!legacy) {
    return null;
  }

  const migratedHash = isLegacyPlaintextPin(legacy)
    ? await hashAppLockPin(legacy)
    : legacy;

  await secureSet(APP_LOCK_PIN_HASH_KEY, migratedHash);
  await secureDelete(LEGACY_APP_LOCK_PIN_KEY);
  return migratedHash;
}

export async function savePinHash(pin: string): Promise<void> {
  const hash = await hashAppLockPin(pin);
  await secureSet(APP_LOCK_PIN_HASH_KEY, hash);
  await secureDelete(LEGACY_APP_LOCK_PIN_KEY);
}

export async function verifyStoredPin(pin: string): Promise<boolean> {
  const storedHash = await readStoredPinHash();
  if (!storedHash) {
    return false;
  }

  const inputHash = await hashAppLockPin(pin);
  return storedHash === inputHash;
}

export async function deleteStoredPin(): Promise<void> {
  await secureDelete(APP_LOCK_PIN_HASH_KEY);
  await secureDelete(LEGACY_APP_LOCK_PIN_KEY);
}

export async function hasStoredPinHash(): Promise<boolean> {
  return (await readStoredPinHash()) !== null;
}

export async function readAppLockSettings(): Promise<{
  enabled: boolean;
  type: AppLockType | null;
}> {
  const enabledValue = await secureGet(APP_LOCK_ENABLED_KEY);
  const typeValue = await secureGet(APP_LOCK_TYPE_KEY);

  if (enabledValue !== 'true') {
    return { enabled: false, type: null };
  }

  const type: AppLockType | null =
    typeValue === 'pin' || typeValue === 'biometric' ? typeValue : null;

  return { enabled: true, type };
}

export async function persistAppLockSettings(
  enabled: boolean,
  type: AppLockType | null,
): Promise<void> {
  if (enabled && type) {
    await secureSet(APP_LOCK_ENABLED_KEY, 'true');
    await secureSet(APP_LOCK_TYPE_KEY, type);
    return;
  }

  await secureDelete(APP_LOCK_ENABLED_KEY);
  await secureDelete(APP_LOCK_TYPE_KEY);
}
