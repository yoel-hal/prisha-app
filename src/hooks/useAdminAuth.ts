import { useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { auth, functions } from '../firebase/config';
import { useAdminStore } from '../store/adminStore';

const ADMIN_PIN_SESSION_KEY = 'adminPinVerified';
const ADMIN_UID = process.env.EXPO_PUBLIC_ADMIN_UID ?? '';

function readSessionPinVerified(): boolean {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return false;
  }
  return sessionStorage.getItem(ADMIN_PIN_SESSION_KEY) === 'true';
}

function writeSessionPinVerified(verified: boolean): void {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return;
  }
  if (verified) {
    sessionStorage.setItem(ADMIN_PIN_SESSION_KEY, 'true');
  } else {
    sessionStorage.removeItem(ADMIN_PIN_SESSION_KEY);
  }
}

export function useAdminAuth() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const pinVerified = useAdminStore((state) => state.pinVerified);
  const setPinVerified = useAdminStore((state) => state.setPinVerified);

  useEffect(() => {
    if (readSessionPinVerified()) {
      setPinVerified(true);
    }
  }, [setPinVerified]);

  useEffect(() => {
    let cancelled = false;

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (cancelled) {
        return;
      }

      if (!ADMIN_UID || !user || user.uid !== ADMIN_UID) {
        setIsAuthorized(false);
        router.replace('/');
        return;
      }

      setIsAuthorized(true);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [router]);

  const verifyPin = useCallback(
    async (pin: string): Promise<boolean> => {
      try {
        const callable = httpsCallable<{ pin: string }, { success: boolean }>(
          functions,
          'verifyAdminPin',
        );
        const result = await callable({ pin });

        if (result.data.success) {
          writeSessionPinVerified(true);
          setPinVerified(true);
          return true;
        }

        return false;
      } catch {
        return false;
      }
    },
    [setPinVerified],
  );

  const logout = useCallback(() => {
    writeSessionPinVerified(false);
    setPinVerified(false);
  }, [setPinVerified]);

  return {
    isAuthorized,
    isPinVerified: pinVerified,
    verifyPin,
    logout,
  };
}
