import { Stack } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PinKeypad } from '../../../src/components/common/PinKeypad';
import { useAppLock } from '../../../src/hooks/useAppLock';
import { useAuthStore } from '../../../src/store/authStore';
import { showAlert } from '../../../src/utils/alert';
import { textStartStyle } from '../../../src/utils/rtl';
import { webScreenScrollStyles } from '../../../src/utils/webScroll';

type PinSetupStep = 'enter' | 'confirm';
type PinModalMode = 'setup' | 'disable';

export default function PrivacySettingsScreen() {
  const { t } = useTranslation();
  const webScroll = webScreenScrollStyles();
  const appLockEnabled = useAuthStore((state) => state.appLockEnabled);
  const appLockType = useAuthStore((state) => state.appLockType);
  const {
    enrollPin,
    enrollBiometric,
    disableLock,
    verifyPin,
    verifyBiometric,
    isLockAvailable,
  } = useAppLock();

  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinModalMode, setPinModalMode] = useState<PinModalMode>('setup');
  const [pinSetupStep, setPinSetupStep] = useState<PinSetupStep>('enter');
  const [pendingPin, setPendingPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [enrollingBiometric, setEnrollingBiometric] = useState(false);
  const [disablingLock, setDisablingLock] = useState(false);
  const pinSetupStepRef = useRef(pinSetupStep);
  pinSetupStepRef.current = pinSetupStep;
  const pendingPinRef = useRef(pendingPin);
  pendingPinRef.current = pendingPin;

  const resetPinModal = useCallback(() => {
    setShowPinModal(false);
    setPinModalMode('setup');
    setPinSetupStep('enter');
    setPendingPin('');
    setPinError(null);
    setDisablingLock(false);
  }, []);

  const startDisableLock = useCallback(async () => {
    if (appLockType === 'biometric') {
      setDisablingLock(true);
      try {
        const success = await verifyBiometric(t('appLock.confirmDisablePin'));
        if (!success) {
          return;
        }
        await disableLock();
      } finally {
        setDisablingLock(false);
      }
      return;
    }

    setPinModalMode('disable');
    setPinSetupStep('enter');
    setPendingPin('');
    setPinError(null);
    setShowPinModal(true);
  }, [appLockType, disableLock, t, verifyBiometric]);

  const handleToggle = useCallback(
    (enabled: boolean) => {
      if (enabled) {
        setShowTypePicker(true);
        return;
      }

      void startDisableLock();
    },
    [startDisableLock],
  );

  const handleSelectPin = useCallback(() => {
    setShowTypePicker(false);
    setPinModalMode('setup');
    setPinSetupStep('enter');
    setPendingPin('');
    setPinError(null);
    setShowPinModal(true);
  }, []);

  const handleSelectBiometric = useCallback(async () => {
    setShowTypePicker(false);
    setEnrollingBiometric(true);

    try {
      const success = await enrollBiometric(t('appLock.biometricPrompt'));
      if (!success) {
        showAlert(t('appLock.biometricUnavailable'));
      }
    } finally {
      setEnrollingBiometric(false);
    }
  }, [enrollBiometric, t]);

  const handleDisablePinComplete = useCallback(
    async (pin: string) => {
      const valid = await verifyPin(pin);
      if (!valid) {
        setPinError(t('appLock.wrongPin'));
        return;
      }

      await disableLock();
      resetPinModal();
    },
    [disableLock, resetPinModal, t, verifyPin],
  );

  const handlePinComplete = useCallback(
    async (pin: string) => {
      if (pinModalMode === 'disable') {
        await handleDisablePinComplete(pin);
        return;
      }

      if (pinSetupStepRef.current === 'enter') {
        pendingPinRef.current = pin;
        setPendingPin(pin);
        setPinSetupStep('confirm');
        setPinError(null);
        return;
      }

      if (pin !== pendingPinRef.current) {
        pendingPinRef.current = '';
        setPinError(t('appLock.pinMismatch'));
        setPinSetupStep('enter');
        setPendingPin('');
        return;
      }

      await enrollPin(pin);
      resetPinModal();
      showAlert(t('appLock.pinSet'));
    },
    [enrollPin, handleDisablePinComplete, pinModalMode, resetPinModal, t],
  );

  const lockTypeLabel =
    appLockType === 'biometric'
      ? t('appLock.typeBiometric')
      : appLockType === 'pin'
        ? t('appLock.typePin')
        : null;

  return (
    <>
      <Stack.Screen options={{ title: t('settings.privacy') }} />
      <SafeAreaView style={[styles.safe, webScroll.safe]} edges={['bottom']}>
        <ScrollView
          style={webScroll.scroll}
          contentContainerStyle={styles.scrollContent}
        >
          <Text style={[styles.sectionTitle, textStartStyle()]}>
            {t('appLock.title')}
          </Text>

          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={[styles.rowLabel, textStartStyle()]}>
                {t('appLock.enable')}
              </Text>
              {appLockEnabled && lockTypeLabel ? (
                <Text style={[styles.rowHint, textStartStyle()]}>
                  {lockTypeLabel}
                </Text>
              ) : null}
            </View>
            <Switch
              value={appLockEnabled}
              onValueChange={handleToggle}
              disabled={enrollingBiometric || disablingLock}
            />
          </View>
        </ScrollView>
      </SafeAreaView>

      <Modal
        visible={showTypePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTypePicker(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setShowTypePicker(false)}
        >
          <Pressable style={styles.modalCard} onPress={() => undefined}>
            <Text style={[styles.modalTitle, textStartStyle()]}>
              {t('appLock.title')}
            </Text>
            <Pressable style={styles.typeOption} onPress={handleSelectPin}>
              <Text style={[styles.typeOptionText, textStartStyle()]}>
                {t('appLock.typePin')}
              </Text>
            </Pressable>
            {Platform.OS !== 'web' && isLockAvailable.biometric ? (
              <Pressable
                style={styles.typeOption}
                onPress={() => void handleSelectBiometric()}
                disabled={enrollingBiometric}
              >
                <Text style={[styles.typeOptionText, textStartStyle()]}>
                  {t('appLock.typeBiometric')}
                </Text>
              </Pressable>
            ) : null}
            <Pressable
              style={styles.cancelOption}
              onPress={() => setShowTypePicker(false)}
            >
              <Text style={styles.cancelOptionText}>{t('deleteAccount.cancel')}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={showPinModal}
        transparent
        animationType="slide"
        onRequestClose={resetPinModal}
      >
        <View style={styles.pinModalBackdrop}>
          <View style={styles.pinModalCard}>
            <PinKeypad
              key={`${pinModalMode}-${pinSetupStep}-${pinError ?? 'idle'}`}
              title={
                pinModalMode === 'disable'
                  ? t('appLock.confirmDisablePin')
                  : pinSetupStep === 'enter'
                    ? t('appLock.enterPin')
                    : t('appLock.confirmPin')
              }
              error={pinError}
              onComplete={(pin) => {
                void handlePinComplete(pin);
              }}
            />
            <Pressable style={styles.pinModalCancel} onPress={resetPinModal}>
              <Text style={styles.cancelOptionText}>{t('deleteAccount.cancel')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e5e5',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  rowText: {
    flex: 1,
    gap: 4,
    paddingEnd: 12,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  rowHint: {
    fontSize: 14,
    color: '#666',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    gap: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  typeOption: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  typeOptionText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  cancelOption: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelOptionText: {
    fontSize: 16,
    color: '#666',
  },
  pinModalBackdrop: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    padding: 24,
  },
  pinModalCard: {
    gap: 24,
  },
  pinModalCancel: {
    alignItems: 'center',
    paddingVertical: 12,
  },
});
