import * as LocalAuthentication from 'expo-local-authentication';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { useAuthStore, type AppLockType } from '../store/authStore';
import { usePinStore } from '../store/pinStore';
import {
  deleteStoredPin,
  hasStoredPinHash,
  persistAppLockSettings,
  readAppLockSettings,
  savePinHash,
  verifyStoredPin,
} from '../utils/appLockStorage';

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

export async function hydrateAppLockFromStorage(): Promise<void> {
  const { enabled, type } = await readAppLockSettings();

  if (!enabled) {
    useAuthStore.getState().setAppLock(false, null);
    return;
  }

  useAuthStore.getState().setAppLock(true, type);
}

export function useAppLock() {
  const setAppLock = useAuthStore((state) => state.setAppLock);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    void readBiometricAvailable().then(setBiometricAvailable);
  }, []);

  const enrollPin = useCallback(
    async (pin: string): Promise<void> => {
      await savePinHash(pin);
      await persistAppLockSettings(true, 'pin');
      setAppLock(true, 'pin');
      usePinStore.getState().setUnlocked(true);
    },
    [setAppLock],
  );

  const verifyPin = useCallback(async (pin: string): Promise<boolean> => {
    return verifyStoredPin(pin);
  }, []);

  const verifyBiometric = useCallback(
    async (promptMessage: string): Promise<boolean> => {
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
    },
    [],
  );

  const enrollBiometric = useCallback(
    async (promptMessage: string): Promise<boolean> => {
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
      usePinStore.getState().setUnlocked(true);
      return true;
    },
    [setAppLock],
  );

  const disableLock = useCallback(async (): Promise<void> => {
    await deleteStoredPin();
    await persistAppLockSettings(false, null);
    setAppLock(false, null);
    usePinStore.getState().resetUnlock();
  }, [setAppLock]);

  const hasStoredPin = useCallback(async (): Promise<boolean> => {
    return hasStoredPinHash();
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
