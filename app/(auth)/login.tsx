import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import AuthSignInButtons from '../../src/components/auth/AuthSignInButtons';

function LoginScreen() {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('auth.title')}</Text>
      <Text style={styles.subtitle}>{t('auth.subtitle')}</Text>
      <AuthSignInButtons emailRoute="/register" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
  },
});

export default LoginScreen;
