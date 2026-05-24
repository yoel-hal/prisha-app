import { Feather } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
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
import type { User } from 'firebase/auth';

import { signInWithApple, signInWithGoogle } from '../../firebase/auth';

type OAuthSignInButtonsProps = {
  onSuccess: (user: User) => void | Promise<void>;
  disabled?: boolean;
};

export function OAuthSignInButtons({ onSuccess, disabled = false }: OAuthSignInButtonsProps) {
  const { t } = useTranslation();
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

    if (result.success && result.user) {
      await onSuccess(result.user);
      return;
    }

    if (!result.success && result.error) {
      Alert.alert(t('auth.signIn'), result.error);
    }
  }

  async function handleAppleSignIn() {
    setLoading(true);
    const result = await signInWithApple();
    setLoading(false);

    if (result.success && result.user) {
      await onSuccess(result.user);
      return;
    }

    if (!result.success && result.error) {
      Alert.alert(t('auth.signIn'), result.error);
    }
  }

  const isDisabled = disabled || loading;

  return (
    <View style={styles.buttons}>
      <Pressable
        style={[styles.button, styles.googleButton]}
        onPress={() => void handleGoogleSignIn()}
        disabled={isDisabled}
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
          onPress={() => void handleAppleSignIn()}
          disabled={isDisabled}
        >
          <Feather name="smartphone" size={20} color="#fff" />
          <Text style={styles.buttonText}>{t('auth.continueWithApple')}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
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
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
