import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


export default function WelcomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.title}>{t('onboarding.welcome')}</Text>
          <Text style={styles.tagline}>{t('onboarding.tagline')}</Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={styles.primaryButton}
            onPress={() => router.push('/onboarding/language')}
          >
            <Text style={styles.primaryButtonText}>{t('onboarding.getStarted')}</Text>
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={() => router.push('/join')}>
            <Text style={styles.secondaryButtonText}>{t('partner.haveInvite')}</Text>
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    gap: 40,
  },
  hero: {
    alignItems: 'center',
    gap: 12,
  },
  title: {
    color: '#2A2226',
    fontSize: 26,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 34,
  },
  tagline: {
    fontSize: 17,
    color: '#5F5459',
    textAlign: 'center',
    lineHeight: 24,
  },
  actions: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#A8485F',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  secondaryButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#DDD3CC',
  },
  secondaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#2A2226',
  },
});
