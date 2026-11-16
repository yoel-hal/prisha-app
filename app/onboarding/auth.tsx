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
    backgroundColor: '#FBF8F5',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#5F5459',
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
    backgroundColor: '#A8485F',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#F4EFEA',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#EAE3DD',
  },
  secondaryButtonText: {
    color: '#2A2226',
    fontSize: 16,
    fontWeight: '600',
  },
});
