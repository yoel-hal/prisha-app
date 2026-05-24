import { Stack } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  createPartnerAccess,
  getPartnerAccess,
  type PartnerAccess,
} from '../../../src/firebase/firestore';
import { useCouple } from '../../../src/hooks/useCouple';
import { useAuthStore } from '../../../src/store/authStore';
import {
  clearOwnerInvitePin,
  loadOwnerInvitePin,
  saveOwnerInvitePin,
} from '../../../src/utils/partnerInviteCache';
import { showAlert } from '../../../src/utils/alert';
import { textStartStyle } from '../../../src/utils/rtl';
import { webScreenScrollStyles } from '../../../src/utils/webScroll';

function formatRelativeLastSeen(iso: string, language: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60_000);
  const rtf = new Intl.RelativeTimeFormat(language, { numeric: 'auto' });

  if (Math.abs(minutes) < 60) {
    return rtf.format(-minutes, 'minute');
  }
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) {
    return rtf.format(-hours, 'hour');
  }
  const days = Math.round(hours / 24);
  return rtf.format(-days, 'day');
}

export default function CouplePartnerSettingsScreen() {
  const webScroll = webScreenScrollStyles();
  const { t, i18n } = useTranslation();
  const isPartnerMode = useAuthStore((state) => state.isPartnerMode);
  const ownerName = useAuthStore((state) => state.ownerName);
  const firstName = useAuthStore((state) => state.firstName);
  const user = useAuthStore((state) => state.user);

  const {
    partnerAccess,
    isPartnerConnected,
    isLoadingAccess,
    loading,
    error,
    disconnectPartner,
    refreshCoupleState,
    setPartnerAccess,
  } = useCouple();

  console.log('[CoupleScreen] render — isLoadingAccess:', isLoadingAccess, 'isPartnerConnected:', isPartnerConnected, 'partnerAccess:', JSON.stringify(partnerAccess));

  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [showCodeModalVisible, setShowCodeModalVisible] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [generatedPin, setGeneratedPin] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [cachedPin, setCachedPin] = useState<string | null>(null);

  const loadCachedPin = useCallback(async () => {
    const pin = await loadOwnerInvitePin();
    setCachedPin(pin);
  }, []);

  useEffect(() => {
    void loadCachedPin();
  }, [loadCachedPin, partnerAccess?.token]);

  useEffect(() => {
    if (!isPartnerConnected || !user?.uid) return;

    const interval = setInterval(() => {
      void refreshCoupleState();
    }, 30_000);

    return () => clearInterval(interval);
  }, [isPartnerConnected, user?.uid, refreshCoupleState]);

  const handleGenerateInvite = useCallback(async () => {
    if (!user?.uid || pinInput.length !== 4) {
      return;
    }

    setGenerating(true);
    try {
      const ownerDisplayName = firstName.trim() || t('couple.title');
      const token = await createPartnerAccess(user.uid, ownerDisplayName, pinInput);
      await saveOwnerInvitePin(pinInput);
      setCachedPin(pinInput);
      setGeneratedToken(token);
      setGeneratedPin(pinInput);

      const access = await getPartnerAccess(user.uid);
      if (access) {
        setPartnerAccess(access);
      }
      await refreshCoupleState();
    } catch {
      Alert.alert(t('partner.connectionFailed'));
    } finally {
      setGenerating(false);
    }
  }, [
    firstName,
    pinInput,
    refreshCoupleState,
    setPartnerAccess,
    t,
    user?.uid,
  ]);

  const handleShareInvite = useCallback(async () => {
    const code = generatedToken ?? partnerAccess?.token;
    const pin = generatedPin ?? cachedPin;
    if (!code || !pin) {
      return;
    }

    const message = t('partner.shareMessage', { code, pin });
    await Share.share({ message });
  }, [cachedPin, generatedPin, generatedToken, partnerAccess?.token, t]);

  const handleShowCodeAgain = useCallback(async () => {
    const pin = await loadOwnerInvitePin();
    setCachedPin(pin);
    if (partnerAccess?.token) {
      setGeneratedToken(partnerAccess.token);
      setGeneratedPin(pin);
    }
    setShowCodeModalVisible(true);
  }, [partnerAccess?.token]);

  const handleDisconnect = useCallback(() => {
    showAlert(t('partner.disconnectPartner'), t('partner.disconnectConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('partner.disconnectPartner'),
        style: 'destructive',
        onPress: () => {
          void (async () => {
            await disconnectPartner();
            await clearOwnerInvitePin();
            setCachedPin(null);
            setGeneratedToken(null);
            setGeneratedPin(null);
          })();
        },
      },
    ]);
  }, [disconnectPartner, t]);

  if (isPartnerMode) {
    return (
      <>
        <Stack.Screen options={{ title: t('couple.title') }} />
        <SafeAreaView style={[styles.safe, webScroll.safe]} edges={['bottom']}>
          <View style={styles.partnerReadOnly}>
            <Text style={[styles.partnerNote, textStartStyle()]}>
              {t('partner.partnerModeNote', { name: ownerName })}
            </Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  const activeAccess: PartnerAccess | null =
    partnerAccess?.isActive ? partnerAccess : null;
  const displayCode = generatedToken ?? activeAccess?.token ?? null;
  const displayPin = generatedPin ?? cachedPin;

  return (
    <>
      <Stack.Screen options={{ title: t('couple.title') }} />
      <SafeAreaView style={[styles.safe, webScroll.safe]} edges={['bottom']}>
        <ScrollView style={webScroll.scroll} contentContainerStyle={styles.scroll}>
          {error ? (
            <Text style={[styles.errorText, textStartStyle()]}>{error}</Text>
          ) : null}

          <Text style={[styles.sectionTitle, textStartStyle()]}>
            {t('partner.inviteTitle')}
          </Text>
          <Text style={[styles.description, textStartStyle()]}>
            {t('partner.inviteDescription')}
          </Text>

          {isLoadingAccess ? (
            <ActivityIndicator style={styles.accessLoader} />
          ) : null}

          {!isLoadingAccess && isPartnerConnected && activeAccess ? (
            <View style={styles.connectedCard}>
              <Text style={[styles.connectedTitle, textStartStyle()]}>
                {t('partner.partnerConnected')}
              </Text>
              {activeAccess.partnerLastSeen ? (
                <Text style={[styles.lastSeen, textStartStyle()]}>
                  {t('partner.lastSeen', {
                    time: formatRelativeLastSeen(
                      activeAccess.partnerLastSeen,
                      i18n.language,
                    ),
                  })}
                </Text>
              ) : null}
              <Pressable
                style={styles.secondaryButton}
                onPress={() => void handleShowCodeAgain()}
              >
                <Text style={styles.secondaryButtonText}>
                  {t('partner.showCodeAgain')}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.dangerButton, loading && styles.buttonDisabled]}
                onPress={handleDisconnect}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#C62828" />
                ) : (
                  <Text style={styles.dangerButtonText}>
                    {t('partner.disconnectPartner')}
                  </Text>
                )}
              </Pressable>
            </View>
          ) : null}

          {!isLoadingAccess && !isPartnerConnected ? (
            <Pressable
              style={styles.primaryButton}
              onPress={() => {
                setPinInput('');
                setGeneratedToken(null);
                setGeneratedPin(null);
                setInviteModalVisible(true);
              }}
            >
              <Text style={styles.primaryButtonText}>
                {t('partner.generateInvite')}
              </Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </SafeAreaView>

      <Modal
        visible={inviteModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setInviteModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={[styles.modalTitle, textStartStyle()]}>
              {t('partner.inviteTitle')}
            </Text>

            {!displayCode ? (
              <>
                <Text style={[styles.fieldLabel, textStartStyle()]}>
                  {t('partner.choosePin')}
                </Text>
                <TextInput
                  style={[styles.input, textStartStyle()]}
                  value={pinInput}
                  onChangeText={(value) =>
                    setPinInput(value.replace(/\D/g, '').slice(0, 4))
                  }
                  maxLength={4}
                  keyboardType="number-pad"
                  secureTextEntry
                  placeholder="••••"
                  placeholderTextColor="#999"
                />
                <Pressable
                  style={[
                    styles.primaryButton,
                    (generating || pinInput.length < 4) && styles.buttonDisabled,
                  ]}
                  onPress={() => void handleGenerateInvite()}
                  disabled={generating || pinInput.length < 4}
                >
                  {generating ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.primaryButtonText}>
                      {t('partner.generateInvite')}
                    </Text>
                  )}
                </Pressable>
              </>
            ) : (
              <>
                <Text style={[styles.codeLabel, textStartStyle()]}>
                  {t('partner.inviteCode')}
                </Text>
                <Text style={styles.codeValue}>{displayCode}</Text>
                {displayPin ? (
                  <>
                    <Text style={[styles.codeLabel, textStartStyle()]}>
                      {t('partner.invitePin')}
                    </Text>
                    <Text style={styles.codeValue}>{displayPin}</Text>
                  </>
                ) : null}
                <Pressable
                  style={styles.primaryButton}
                  onPress={() => void handleShareInvite()}
                >
                  <Text style={styles.primaryButtonText}>
                    {t('partner.shareInvite')}
                  </Text>
                </Pressable>
              </>
            )}

            <Pressable
              style={styles.modalClose}
              onPress={() => setInviteModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>{t('common.done')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showCodeModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setShowCodeModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={[styles.codeLabel, textStartStyle()]}>
              {t('partner.inviteCode')}
            </Text>
            <Text style={styles.codeValue}>{activeAccess?.token ?? ''}</Text>
            {cachedPin ? (
              <>
                <Text style={[styles.codeLabel, textStartStyle()]}>
                  {t('partner.invitePin')}
                </Text>
                <Text style={styles.codeValue}>{cachedPin}</Text>
              </>
            ) : null}
            <Pressable
              style={styles.primaryButton}
              onPress={() => void handleShareInvite()}
            >
              <Text style={styles.primaryButtonText}>{t('partner.shareInvite')}</Text>
            </Pressable>
            <Pressable
              style={styles.modalClose}
              onPress={() => setShowCodeModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>{t('common.done')}</Text>
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
  scroll: {
    padding: 20,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  description: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  accessLoader: {
    marginVertical: 24,
  },
  connectedCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#c7d4f0',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    backgroundColor: '#f0f4ff',
  },
  connectedTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#3a5a9a',
  },
  lastSeen: {
    fontSize: 14,
    color: '#555',
  },
  partnerReadOnly: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  partnerNote: {
    fontSize: 17,
    color: '#3a5a9a',
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#3a5a9a',
  },
  secondaryButtonText: {
    color: '#3a5a9a',
    fontSize: 15,
    fontWeight: '600',
  },
  dangerButton: {
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#FFCDD2',
    backgroundColor: '#FFEBEE',
  },
  dangerButtonText: {
    color: '#C62828',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  errorText: {
    fontSize: 14,
    color: '#C62828',
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
    gap: 12,
    ...(Platform.OS === 'web' ? ({ maxWidth: 420, alignSelf: 'center', width: '100%' } as const) : null),
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 18,
  },
  codeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
  },
  codeValue: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 3,
    textAlign: 'center',
    color: '#1a1a1a',
  },
  modalClose: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  modalCloseText: {
    fontSize: 15,
    color: '#666',
  },
});
