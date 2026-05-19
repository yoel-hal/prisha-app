import { Stack } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useCouple } from '../../../src/hooks/useCouple';
import { textStartStyle } from '../../../src/utils/rtl';
import { webScreenScrollStyles } from '../../../src/utils/webScroll';

export default function CoupleSyncSettingsScreen() {
  const webScroll = webScreenScrollStyles();
  const { t } = useTranslation();
  const {
    partnerEmail,
    outgoingInviteEmail,
    pendingInvite,
    isConnected,
    loading,
    invitePartner,
    disconnect,
    acceptPendingInvite,
    declinePendingInvite,
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

  const handleAccept = useCallback(async () => {
    try {
      await acceptPendingInvite();
      setAcceptedMessage(true);
      setTimeout(() => setAcceptedMessage(false), 4000);
    } catch {
      // handled in hook
    }
  }, [acceptPendingInvite]);

  return (
    <>
      <Stack.Screen options={{ title: t('couple.title') }} />
      <SafeAreaView style={[styles.safe, webScroll.safe]} edges={['bottom']}>
        <ScrollView style={webScroll.scroll} contentContainerStyle={styles.scroll}>
          {pendingInvite ? (
            <View style={[styles.banner, styles.incomingBanner]}>
              <Text style={[styles.bannerText, textStartStyle()]}>
                {t('couple.pendingInvite', {
                  email: pendingInvite.inviterEmail || t('couple.invitePartner'),
                })}
              </Text>
              <View style={styles.bannerActions}>
                <Pressable
                  style={[styles.bannerButton, styles.acceptButton]}
                  onPress={() => void handleAccept()}
                  disabled={loading}
                >
                  <Text style={styles.bannerButtonText}>
                    {t('couple.acceptInvite')}
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.bannerButton, styles.declineButton]}
                  onPress={() => void declinePendingInvite()}
                  disabled={loading}
                >
                  <Text style={styles.declineButtonText}>
                    {t('couple.declineInvite')}
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          {acceptedMessage ? (
            <Text style={[styles.success, textStartStyle()]}>
              {t('couple.inviteAccepted')}
            </Text>
          ) : null}

          <Text style={[styles.sectionTitle, textStartStyle()]}>
            {t('couple.title')}
          </Text>

          <View style={styles.card}>
            {isConnected && partnerEmail ? (
              <>
                <View style={styles.statusRow}>
                  <Text style={[styles.statusLabel, textStartStyle()]}>
                    {t('couple.partnerConnected', { email: partnerEmail })}
                  </Text>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{t('couple.connected')}</Text>
                  </View>
                </View>
              </>
            ) : (
              <Text style={[styles.soloText, textStartStyle()]}>
                {t('couple.soloMode')}
              </Text>
            )}
          </View>

          {!isConnected ? (
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
              {outgoingInviteEmail ? (
                <Text style={[styles.pendingOutgoing, textStartStyle()]}>
                  {t('couple.pendingInviteOutgoing', {
                    email: outgoingInviteEmail,
                  })}
                </Text>
              ) : null}
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
          ) : (
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
          )}
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
  },
  warning: {
    fontSize: 14,
    color: '#666',
  },
  pendingOutgoing: {
    fontSize: 14,
    color: '#555',
  },
  banner: {
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  incomingBanner: {
    backgroundColor: '#E3F2FD',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#90CAF9',
  },
  bannerText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1565C0',
  },
  bannerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  bannerButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#1565C0',
  },
  declineButton: {
    backgroundColor: '#fff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#90CAF9',
  },
  bannerButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  declineButtonText: {
    color: '#1565C0',
    fontWeight: '600',
  },
});
