import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

function RegisterScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('auth.signUp')}</Text>
      <Text style={styles.placeholder}>{t('auth.email')} / {t('auth.password')}</Text>
      <Pressable style={styles.link} onPress={() => router.back()}>
        <Text style={styles.linkText}>{t('auth.signIn')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
  },
  placeholder: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  link: {
    padding: 12,
  },
  linkText: {
    fontSize: 16,
    color: '#4285F4',
  },
});

export default RegisterScreen;
