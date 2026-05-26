import { Icon } from '@/components/common/Icon';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { completeOnboarding, getPeriods } from '../../src/firebase/firestore';
import { useAuthStore } from '../../src/store/authStore';
import { useOnboardingStore } from '../../src/store/onboardingStore';
import { usePeriodsStore } from '../../src/store/periodsStore';
import { useSettingsStore } from '../../src/store/settingsStore';

export default function OnboardingDoneScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const firstName = useAuthStore((state) => state.firstName);
  const lastName = useAuthStore((state) => state.lastName);
  const phone = useAuthStore((state) => state.phone);
  const { language, minhag, chumrot, country } = useOnboardingStore();
  const [saving, setSaving] = useState(false);

  async function handleStart() {
    if (!user?.email) {
      return;
    }

    setSaving(true);
    try {
      const coupleId = await completeOnboarding(user.uid, {
        email: user.email,
        language,
        minhag,
        chumrot,
        country,
        firstName,
        lastName,
        phone,
      });

      useAuthStore.getState().setCoupleId(coupleId);
      useAuthStore.getState().setFirestoreOnboardingComplete(true);
      await useSettingsStore.getState().loadSettings(coupleId);
      const periods = await getPeriods(coupleId);
      usePeriodsStore.getState().setPeriods(periods);
      router.replace('/calendar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <View style={styles.hero}>
          <Icon name="check-circle" size={72} color="#2E7D32" />
          <Text style={styles.title}>{t('onboarding.allSet')}</Text>
          <Text style={styles.subtitle}>{t('onboarding.allSetDesc')}</Text>
        </View>

        <Pressable
          style={[styles.primaryButton, saving && styles.primaryDisabled]}
          onPress={() => void handleStart()}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>{t('onboarding.start')}</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    gap: 48,
  },
  hero: {
    alignItems: 'center',
    gap: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 8,
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
