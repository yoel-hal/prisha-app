import { Stack } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useCouple } from '../../../src/hooks/useCouple';
import { useAuthStore } from '../../../src/store/authStore';
import { textStartStyle } from '../../../src/utils/rtl';
import { webScreenScrollStyles } from '../../../src/utils/webScroll';

function formatInviteExpiry(iso: string, language: string): string {
  return new Date(iso).toLocaleDateString(language, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function CoupleSyncSettingsScreen() {
  const webScroll = webScreenScrollStyles();
  const { t, i18n } = useTranslation();
  const pendingInvite = useAuthStore((state) => state.pendingInvite);
  const {
    partnerEmail,
    outgoingInvite,
    isConnected,
    loading,
    acceptingInvite,
    cancellingInvite,
    error,
    invitePartner,
    disconnect,
    acceptPendingInvite,
    declinePendingInvite,
    cancelOutgoingInvite,
  } = useCouple();

  const [email, setEmail] = useState('');
  const [inviteSent, setInviteSent] = useState(false);
  const [acceptedMessage, setAcceptedMessage] = useState(false);

  const handleSendInvite = useCallback(async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      return;
    }

    try {
      await invitePartner(trimmed);
      setInviteSent(true);
      setEmail('');
      setTimeout(() => setInviteSent(false), 4000);
    } catch {
      // Error surfaced via hook state if needed
    }
  }, [email, invitePartner]);

  const handleDisconnect = useCallback(() => {
    Alert.alert(t('couple.disconnect'), t('couple.disconnectConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('couple.disconnect'),
        style: 'destructive',
        onPress: () => {
          void disconnect();
        },
      },
    ]);
  }, [disconnect, t]);

  const runCancelInvite = useCallback(async () => {
    try {
      await cancelOutgoingInvite();
    } catch {
      // errors logged in hook
    }
  }, [cancelOutgoingInvite]);

  const handleCancelInvite = useCallback(() => {
    Alert.alert(t('couple.cancelInvite'), t('couple.cancelInviteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('couple.cancelInvite'),
        style: 'destructive',
        onPress: () => {
          void runCancelInvite();
        },
      },
    ]);
  }, [runCancelInvite, t]);

  const handleAccept = useCallback(async () => {
    if (!pendingInvite) {
      console.warn('[CoupleScreen] accept pressed but pendingInvite is null');
      return;
    }

    console.log('[CoupleScreen] accept pressed', pendingInvite);

    try {
      await acceptPendingInvite();
      setAcceptedMessage(true);
      setTimeout(() => setAcceptedMessage(false), 4000);
    } catch (acceptError) {
      console.error('[CoupleScreen] accept failed', acceptError);
    }
  }, [acceptPendingInvite, pendingInvite]);

  const hasOutgoingInvite = Boolean(outgoingInvite && !isConnected);

  return (
    <>
      <Stack.Screen options={{ title: t('couple.title') }} />
      <SafeAreaView style={[styles.safe, webScroll.safe]} edges={['bottom']}>
        <ScrollView style={webScroll.scroll} contentContainerStyle={styles.scroll}>
          {error ? (
            <Text style={[styles.errorText, textStartStyle()]}>{error}</Text>
          ) : null}

          {pendingInvite ? (
            <View style={styles.incomingBanner}>
              <Text style={[styles.incomingTitle, textStartStyle()]}>
                {t('couple.pendingInvite')}
              </Text>
              <Text style={[styles.incomingSubtitle, textStartStyle()]}>
                {t('couple.invitedBy', {
                  email:
                    pendingInvite.inviterEmail || t('couple.invitePartner'),
                })}
              </Text>
              <Pressable
                style={[
                  styles.acceptButtonLarge,
                  acceptingInvite && styles.buttonDisabled,
                ]}
                onPress={() => void handleAccept()}
                disabled={acceptingInvite || cancellingInvite}
              >
                {acceptingInvite ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.acceptButtonLargeText}>
                    {t('couple.acceptInvite')}
                  </Text>
                )}
              </Pressable>
              <Pressable
                style={[
                  styles.declineButtonLarge,
                  (acceptingInvite || loading) && styles.buttonDisabled,
                ]}
                onPress={() => void declinePendingInvite()}
                disabled={acceptingInvite || loading}
              >
                <Text style={styles.declineButtonLargeText}>
                  {t('couple.declineInvite')}
                </Text>
              </Pressable>
            </View>
          ) : null}

          {acceptedMessage ? (
            <Text style={[styles.success, textStartStyle()]}>
              {t('couple.connectedToPartner')}
            </Text>
          ) : null}

          {hasOutgoingInvite && outgoingInvite ? (
            <View style={styles.outgoingBanner}>
              <Text style={[styles.outgoingTitle, textStartStyle()]}>
                {t('couple.inviteSentTo', { email: outgoingInvite.partnerEmail })}
              </Text>
              <Text style={[styles.outgoingStatus, textStartStyle()]}>
                {t('couple.waitingForAccept')}
              </Text>
              <Text style={[styles.outgoingExpiry, textStartStyle()]}>
                {t('couple.inviteExpires', {
                  date: formatInviteExpiry(
                    outgoingInvite.expiresAt,
                    i18n.language,
                  ),
                })}
              </Text>
              <Pressable
                style={[
                  styles.cancelInviteButton,
                  cancellingInvite && styles.buttonDisabled,
                ]}
                onPress={handleCancelInvite}
                disabled={cancellingInvite || acceptingInvite}
              >
                {cancellingInvite ? (
                  <ActivityIndicator color="#666" />
                ) : (
                  <Text style={styles.cancelInviteButtonText}>
                    {t('couple.cancelInvite')}
                  </Text>
                )}
              </Pressable>
            </View>
          ) : null}

          <Text style={[styles.sectionTitle, textStartStyle()]}>
            {t('couple.title')}
          </Text>

          <View style={styles.card}>
            {isConnected && partnerEmail ? (
              <View style={styles.statusRow}>
                <Text style={[styles.statusLabel, textStartStyle()]}>
                  {t('couple.partnerConnected', { email: partnerEmail })}
                </Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{t('couple.connected')}</Text>
                </View>
              </View>
            ) : (
              <Text style={[styles.soloText, textStartStyle()]}>
                {t('couple.soloMode')}
              </Text>
            )}
          </View>

          {!isConnected && !hasOutgoingInvite ? (
            <View style={styles.section}>
              <Text style={[styles.sectionHeading, textStartStyle()]}>
                {t('couple.invitePartner')}
              </Text>
              <Text style={[styles.fieldLabel, textStartStyle()]}>
                {t('couple.partnerEmail')}
              </Text>
              <TextInput
                style={[styles.input, textStartStyle()]}
                value={email}
                onChangeText={setEmail}
                placeholder={t('auth.emailPlaceholder')}
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="emailAddress"
              />
              {inviteSent ? (
                <Text style={[styles.success, textStartStyle()]}>
                  {t('couple.inviteSent')}
                </Text>
              ) : null}
              <Pressable
                style={[styles.primaryButton, loading && styles.buttonDisabled]}
                onPress={() => void handleSendInvite()}
                disabled={loading || !email.trim()}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    {t('couple.sendInvite')}
                  </Text>
                )}
              </Pressable>
            </View>
          ) : null}

          {isConnected ? (
            <View style={styles.section}>
              <Text style={[styles.sectionHeading, textStartStyle()]}>
                {partnerEmail}
              </Text>
              <Text style={[styles.warning, textStartStyle()]}>
                {t('couple.disconnectWarning')}
              </Text>
              <Pressable
                style={[styles.dangerButton, loading && styles.buttonDisabled]}
                onPress={handleDisconnect}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#C62828" />
                ) : (
                  <Text style={styles.dangerButtonText}>
                    {t('couple.disconnect')}
                  </Text>
                )}
              </Pressable>
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
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
  incomingBanner: {
    backgroundColor: '#E8F5E9',
    borderWidth: 2,
    borderColor: '#43A047',
    borderRadius: 14,
    padding: 20,
    gap: 12,
    marginBottom: 4,
  },
  incomingTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1B5E20',
  },
  incomingSubtitle: {
    fontSize: 16,
    color: '#2E7D32',
    fontWeight: '500',
  },
  acceptButtonLarge: {
    backgroundColor: '#2E7D32',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  acceptButtonLargeText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  declineButtonLarge: {
    backgroundColor: '#EEEEEE',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  declineButtonLargeText: {
    color: '#616161',
    fontSize: 16,
    fontWeight: '600',
  },
  outgoingBanner: {
    backgroundColor: '#FFF8E1',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#FFB300',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  outgoingTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#E65100',
  },
  outgoingStatus: {
    fontSize: 15,
    color: '#F57C00',
    fontWeight: '500',
  },
  outgoingExpiry: {
    fontSize: 14,
    color: '#666',
  },
  cancelInviteButton: {
    marginTop: 8,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ccc',
    backgroundColor: '#fff',
  },
  cancelInviteButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e5e5',
    borderRadius: 12,
    padding: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  statusLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  soloText: {
    fontSize: 16,
    color: '#333',
  },
  badge: {
    backgroundColor: '#E8F5E9',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    color: '#2E7D32',
    fontSize: 13,
    fontWeight: '600',
  },
  section: {
    gap: 12,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '600',
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
    fontSize: 16,
  },
  primaryButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dangerButton: {
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#FFCDD2',
    backgroundColor: '#FFEBEE',
    marginTop: 8,
  },
  dangerButtonText: {
    color: '#C62828',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  success: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '600',
  },
  errorText: {
    fontSize: 14,
    color: '#C62828',
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
  },
  warning: {
    fontSize: 14,
    color: '#666',
  },
});
