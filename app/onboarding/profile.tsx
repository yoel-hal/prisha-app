import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProfileFormFields } from '../../src/components/settings/ProfileFormFields';
import { useProfileForm } from '../../src/hooks/useProfileForm';
import type { SupportedLanguage } from '../../src/i18n';
import { useAuthStore } from '../../src/store/authStore';
import { textStartStyle } from '../../src/utils/rtl';

export default function OnboardingProfileScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const {
    firstName,
    setFirstName,
    lastName,
    setLastName,
    country,
    setCountry,
    phone,
    setPhone,
    loading,
    saving,
    persistProfile,
  } = useProfileForm();

  useEffect(() => {
    if (!user) {
      router.replace('/onboarding/auth');
    }
  }, [user, router]);

  async function handleContinue() {
    const language = i18n.language as SupportedLanguage;
    const saved = await persistProfile(language);
    if (saved) {
      router.push('/onboarding/minhag');
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.title, textStartStyle()]}>
            {t('onboarding.profileTitle')}
          </Text>
          <Text style={[styles.subtitle, textStartStyle()]}>
            {t('onboarding.profileSubtitle')}
          </Text>

          {loading ? (
            <ActivityIndicator style={styles.loader} />
          ) : (
            <ProfileFormFields
              firstName={firstName}
              setFirstName={setFirstName}
              lastName={lastName}
              setLastName={setLastName}
              country={country}
              setCountry={setCountry}
              phone={phone}
              setPhone={setPhone}
              disabled={saving}
            />
          )}
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            style={[styles.primaryButton, saving && styles.primaryDisabled]}
            onPress={() => void handleContinue()}
            disabled={saving || loading}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>{t('onboarding.continue')}</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
    gap: 16,
    flexGrow: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    marginBottom: 8,
    lineHeight: 22,
  },
  loader: {
    marginTop: 24,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  primaryButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
  },
  primaryDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
});
