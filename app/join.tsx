import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ensurePartnerGuestAuth } from '../src/firebase/auth';
import { validatePartnerAccess } from '../src/firebase/firestore';
import { useAuthStore } from '../src/store/authStore';
import { useSettingsStore } from '../src/store/settingsStore';
import { savePartnerSession } from '../src/utils/partnerSession';
import { inputStartStyle, textStartStyle } from '../src/utils/rtl';

export default function JoinPartnerScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { rejoin } = useLocalSearchParams<{ rejoin?: string }>();
  const [code, setCode] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canConnect = code.trim().length === 12 && pin.trim().length === 4;

  async function handleConnect() {
    setLoading(true);
    setError(null);
    try {
      const guest = await ensurePartnerGuestAuth();
      const result = await validatePartnerAccess(
        guest.uid,
        code.trim().toUpperCase(),
        pin.trim(),
      );
      if (!result) {
        setError(t('partner.invalidCode'));
        return;
      }
      await savePartnerSession(
        result.ownerId,
        result.ownerName,
        result.coupleId,
      );
      useAuthStore.getState().setPartnerMode(
        true,
        result.ownerId,
        result.ownerName,
      );
      useAuthStore.getState().setCoupleId(result.coupleId);
      await useSettingsStore.getState().loadSettings(result.coupleId);
      router.replace('/calendar');
    } catch {
      setError(t('partner.connectionFailed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <Text style={styles.logo}>{t('common.appName')}</Text>
        <Text style={[styles.title, textStartStyle()]}>{t('partner.joinTitle')}</Text>
        <Text style={[styles.description, textStartStyle()]}>
          {t('partner.joinDescription')}
        </Text>
        {rejoin === '1' ? (
          <Text style={[styles.notice, textStartStyle()]}>{t('partner.rejoinRequired')}</Text>
        ) : null}

        <Text style={[styles.label, textStartStyle()]}>{t('partner.enterCode')}</Text>
        <TextInput
          style={[styles.input, inputStartStyle()]}
          value={code}
          onChangeText={(value) => setCode(value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
          maxLength={12}
          autoCapitalize="characters"
          autoCorrect={false}
          placeholder="XXXXXXXXXXXX"
          placeholderTextColor="#857A7F"
        />

        <Text style={[styles.label, textStartStyle()]}>{t('partner.enterPin')}</Text>
        <TextInput
          style={[styles.input, inputStartStyle()]}
          value={pin}
          onChangeText={(value) => setPin(value.replace(/\D/g, '').slice(0, 4))}
          maxLength={4}
          keyboardType="number-pad"
          secureTextEntry
          placeholder="••••"
          placeholderTextColor="#857A7F"
        />

        {error ? (
          <Text style={[styles.error, textStartStyle()]}>{error}</Text>
        ) : null}

        <Pressable
          style={[styles.button, (loading || !canConnect) && styles.buttonDisabled]}
          onPress={() => void handleConnect()}
          disabled={loading || !canConnect}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{t('partner.connect')}</Text>
          )}
        </Pressable>

        <Pressable
          accessibilityRole="link"
          style={styles.backLink}
          hitSlop={8}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/onboarding/login'))}
        >
          <Text style={styles.backLinkText}>{t('partner.backToSignIn')}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FBF8F5',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    gap: 12,
  },
  backLink: {
    alignSelf: 'center',
    paddingVertical: 8,
    marginTop: 4,
  },
  backLinkText: {
    fontSize: 15,
    color: '#A8485F',
    fontWeight: '500',
  },
  logo: {
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
  description: {
    fontSize: 16,
    color: '#5F5459',
    marginBottom: 12,
  },
  notice: {
    fontSize: 14,
    color: '#7A5A14',
    backgroundColor: '#F5EEE6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5F5459',
    marginTop: 8,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#DDD3CC',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 18,
    letterSpacing: 2,
  },
  error: {
    color: '#B3261E',
    fontSize: 14,
    marginTop: 4,
  },
  button: {
    backgroundColor: '#A8485F',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
});
