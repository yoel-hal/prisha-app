import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AuthSignInButtons from '../../src/components/auth/AuthSignInButtons';
import { useAuthStore } from '../../src/store/authStore';
import { textStartStyle } from '../../src/utils/rtl';

export default function OnboardingAuthScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (user) {
      router.replace('/onboarding/minhag');
    }
  }, [user, router]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <Text style={[styles.title, textStartStyle()]}>{t('auth.title')}</Text>
        <Text style={[styles.subtitle, textStartStyle()]}>{t('auth.subtitle')}</Text>
        <AuthSignInButtons emailRoute="/register" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 0,
  },
});
