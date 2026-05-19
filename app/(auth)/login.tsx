import { Feather } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { signInWithApple, signInWithGoogle } from '../../src/firebase/auth';

function LoginScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'ios') {
      setAppleAvailable(false);
      return;
    }
    void AppleAuthentication.isAvailableAsync().then(setAppleAvailable);
  }, []);

  async function handleGoogleSignIn() {
    setLoading(true);
    const result = await signInWithGoogle();
    setLoading(false);

    if (!result.success && result.error) {
      Alert.alert(t('auth.signIn'), result.error);
    }
  }

  async function handleAppleSignIn() {
    setLoading(true);
    const result = await signInWithApple();
    setLoading(false);

    if (!result.success && result.error) {
      Alert.alert(t('auth.signIn'), result.error);
    }
  }

  function handleEmailSignIn() {
    router.push('/register');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('auth.title')}</Text>
      <Text style={styles.subtitle}>{t('auth.subtitle')}</Text>

      <View style={styles.buttons}>
        <Pressable
          style={[styles.button, styles.googleButton]}
          onPress={handleGoogleSignIn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Feather name="mail" size={20} color="#fff" />
              <Text style={styles.buttonText}>{t('auth.continueWithGoogle')}</Text>
            </>
          )}
        </Pressable>

        {appleAvailable ? (
          <Pressable
            style={[styles.button, styles.appleButton]}
            onPress={handleAppleSignIn}
            disabled={loading}
          >
            <Feather name="smartphone" size={20} color="#fff" />
            <Text style={styles.buttonText}>{t('auth.continueWithApple')}</Text>
          </Pressable>
        ) : null}

        <Pressable
          style={[styles.button, styles.emailButton]}
          onPress={handleEmailSignIn}
          disabled={loading}
        >
          <Feather name="at-sign" size={20} color="#1a1a1a" />
          <Text style={[styles.buttonText, styles.emailButtonText]}>
            {t('auth.continueWithEmail')}
          </Text>
        </Pressable>
      </View>
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
  buttons: {
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 10,
  },
  googleButton: {
    backgroundColor: '#4285F4',
  },
  appleButton: {
    backgroundColor: '#000',
  },
  emailButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  emailButtonText: {
    color: '#1a1a1a',
  },
});

export default LoginScreen;
