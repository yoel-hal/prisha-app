import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthStore } from '../../src/store/authStore';
import { navigateAfterSignIn } from '../../src/utils/authNavigation';
import { textStartStyle } from '../../src/utils/rtl';

export default function OnboardingAuthChooserScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (user) {
      void navigateAfterSignIn(router, user);
    }
  }, [user, router]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <Text style={[styles.title, textStartStyle()]}>{t('auth.title')}</Text>
        <Text style={[styles.subtitle, textStartStyle()]}>{t('auth.subtitle')}</Text>

        <View style={styles.actions}>
          <Pressable
            style={[styles.button, styles.primaryButton]}
            onPress={() => router.push('/onboarding/register')}
          >
            <Text style={styles.primaryButtonText}>{t('auth.createAccount')}</Text>
          </Pressable>

          <Pressable
            style={[styles.button, styles.secondaryButton]}
            onPress={() => router.push('/onboarding/login')}
          >
            <Text style={styles.secondaryButtonText}>{t('auth.signIn')}</Text>
          </Pressable>
        </View>
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
  },
  actions: {
    gap: 12,
  },
  button: {
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  primaryButton: {
    backgroundColor: '#1a1a1a',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
  },
  secondaryButtonText: {
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: '600',
  },
});
