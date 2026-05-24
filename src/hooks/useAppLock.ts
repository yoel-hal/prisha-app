import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { useAuthStore, type AppLockType } from '../store/authStore';

const APP_LOCK_PIN_KEY = 'app_lock_pin';
const APP_LOCK_ENABLED_KEY = 'app_lock_enabled';
const APP_LOCK_TYPE_KEY = 'app_lock_type';

async function readBiometricAvailable(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return false;
  }

  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  if (!hasHardware) {
    return false;
  }

  return LocalAuthentication.isEnrolledAsync();
}

async function persistAppLockSettings(
  enabled: boolean,
  type: AppLockType | null,
): Promise<void> {
  if (enabled && type) {
    await SecureStore.setItemAsync(APP_LOCK_ENABLED_KEY, 'true');
    await SecureStore.setItemAsync(APP_LOCK_TYPE_KEY, type);
    return;
  }

  await SecureStore.deleteItemAsync(APP_LOCK_ENABLED_KEY);
  await SecureStore.deleteItemAsync(APP_LOCK_TYPE_KEY);
}

export async function hydrateAppLockFromStorage(): Promise<void> {
  const enabledValue = await SecureStore.getItemAsync(APP_LOCK_ENABLED_KEY);
  const typeValue = await SecureStore.getItemAsync(APP_LOCK_TYPE_KEY);

  if (enabledValue !== 'true') {
    useAuthStore.getState().setAppLock(false, null);
    return;
  }

  const type: AppLockType | null =
    typeValue === 'pin' || typeValue === 'biometric' ? typeValue : null;

  useAuthStore.getState().setAppLock(true, type);
}

export function useAppLock() {
  const setAppLock = useAuthStore((state) => state.setAppLock);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    void readBiometricAvailable().then(setBiometricAvailable);
  }, []);

  const enrollPin = useCallback(async (pin: string): Promise<void> => {
    await SecureStore.setItemAsync(APP_LOCK_PIN_KEY, pin);
    await persistAppLockSettings(true, 'pin');
    setAppLock(true, 'pin');
  }, [setAppLock]);

  const verifyPin = useCallback(async (pin: string): Promise<boolean> => {
    const storedPin = await SecureStore.getItemAsync(APP_LOCK_PIN_KEY);
    return storedPin === pin;
  }, []);

  const verifyBiometric = useCallback(async (promptMessage: string): Promise<boolean> => {
    if (Platform.OS === 'web') {
      return false;
    }

    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    if (!hasHardware || !isEnrolled) {
      return false;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
    });

    return result.success;
  }, []);

  const enrollBiometric = useCallback(async (promptMessage: string): Promise<boolean> => {
    if (Platform.OS === 'web') {
      return false;
    }

    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    if (!hasHardware || !isEnrolled) {
      return false;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
    });

    if (!result.success) {
      return false;
    }

    await persistAppLockSettings(true, 'biometric');
    setAppLock(true, 'biometric');
    return true;
  }, [setAppLock]);

  const disableLock = useCallback(async (): Promise<void> => {
    await SecureStore.deleteItemAsync(APP_LOCK_PIN_KEY);
    await persistAppLockSettings(false, null);
    setAppLock(false, null);
  }, [setAppLock]);

  const hasStoredPin = useCallback(async (): Promise<boolean> => {
    const storedPin = await SecureStore.getItemAsync(APP_LOCK_PIN_KEY);
    return storedPin !== null;
  }, []);

  return {
    enrollPin,
    verifyPin,
    enrollBiometric,
    verifyBiometric,
    disableLock,
    hasStoredPin,
    isLockAvailable: {
      pin: true,
      biometric: biometricAvailable,
    },
  };
}
