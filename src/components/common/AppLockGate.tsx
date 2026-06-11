import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppLock } from '../../hooks/useAppLock';
import { useAuthStore } from '../../store/authStore';
import { usePinStore } from '../../store/pinStore';
import { textStartStyle } from '../../utils/rtl';
import { PinKeypad } from './PinKeypad';

type AppLockGateProps = {
  visible: boolean;
};

export function AppLockGate({ visible }: AppLockGateProps) {
  const { t } = useTranslation();
  const appLockType = useAuthStore((state) => state.appLockType);
  const isUnlocked = usePinStore((state) => state.isUnlocked);
  const setUnlocked = usePinStore((state) => state.setUnlocked);
  const { verifyPin, verifyBiometric, hasStoredPin } = useAppLock();

  const [showPinFallback, setShowPinFallback] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [pinFallbackAvailable, setPinFallbackAvailable] = useState(false);

  const runBiometricUnlock = useCallback(async () => {
    setBiometricLoading(true);
    try {
      const success = await verifyBiometric(t('appLock.biometricPrompt'));
      if (success) {
        setUnlocked(true);
        setShowPinFallback(false);
        setPinError(null);
      }
    } finally {
      setBiometricLoading(false);
    }
  }, [setUnlocked, t, verifyBiometric]);

  useEffect(() => {
    if (!visible || isUnlocked || appLockType !== 'biometric' || showPinFallback) {
      return;
    }

    void runBiometricUnlock();
  }, [appLockType, isUnlocked, runBiometricUnlock, showPinFallback, visible]);

  useEffect(() => {
    if (!visible || isUnlocked) {
      setShowPinFallback(false);
      setPinError(null);
      return;
    }

    void hasStoredPin().then(setPinFallbackAvailable);
  }, [hasStoredPin, isUnlocked, visible]);

  const handlePinComplete = useCallback(
    async (pin: string) => {
      const valid = await verifyPin(pin);
      if (valid) {
        setUnlocked(true);
        setPinError(null);
        setShowPinFallback(false);
        return;
      }

      setPinError(t('appLock.wrongPin'));
    },
    [setUnlocked, t, verifyPin],
  );

  if (!visible || isUnlocked) {
    return null;
  }

  const showPinEntry =
    appLockType === 'pin' || (appLockType === 'biometric' && showPinFallback);

  return (
    <View style={styles.overlay} pointerEvents="auto">
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.content}>
          <Text style={[styles.lockedTitle, textStartStyle()]}>
            {t('appLock.locked')}
          </Text>

          {showPinEntry ? (
            <PinKeypad
              key={pinError ?? 'idle'}
              title={t('appLock.enterPin')}
              error={pinError}
              onComplete={(pin) => {
                void handlePinComplete(pin);
              }}
            />
          ) : (
            <View style={styles.biometricSection}>
              {biometricLoading ? (
                <ActivityIndicator size="large" color="#1a1a1a" />
              ) : (
                <>
                  <Text style={[styles.biometricText, textStartStyle()]}>
                    {t('appLock.biometricPrompt')}
                  </Text>
                  <Pressable
                    style={styles.retryButton}
                    onPress={() => void runBiometricUnlock()}
                  >
                    <Text style={styles.retryButtonText}>
                      {t('appLock.biometricPrompt')}
                    </Text>
                  </Pressable>
                </>
              )}

              {pinFallbackAvailable ? (
                <Pressable
                  style={styles.pinFallbackButton}
                  onPress={() => {
                    setShowPinFallback(true);
                    setPinError(null);
                  }}
                >
                  <Text style={styles.pinFallbackText}>
                    {t('appLock.enterPin')}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10000,
    backgroundColor: '#fff',
  },
  safe: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  lockedTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 24,
    color: '#1a1a1a',
  },
  biometricSection: {
    alignItems: 'center',
    gap: 20,
  },
  biometricText: {
    fontSize: 16,
    color: '#444',
    textAlign: 'center',
  },
  retryButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    backgroundColor: '#1a1a1a',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  pinFallbackButton: {
    paddingVertical: 12,
  },
  pinFallbackText: {
    fontSize: 15,
    color: '#4285F4',
    fontWeight: '600',
  },
});
