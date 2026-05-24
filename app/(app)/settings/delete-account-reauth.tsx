import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { authFormStyles } from '../../../src/components/auth/authFormStyles';
import {
  consumeDeleteAccountConfirmed,
  submitDeleteAccountPassword,
} from '../../../src/utils/deleteAccountAlert';
import { textStartStyle } from '../../../src/utils/rtl';
import { webScreenScrollStyles } from '../../../src/utils/webScroll';

export default function DeleteAccountReauthScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const webScroll = webScreenScrollStyles();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!consumeDeleteAccountConfirmed()) {
      router.back();
    }
  }, [router]);

  async function handleDelete() {
    if (password.trim() === '') {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const result = await submitDeleteAccountPassword(t, password);
      if (result === 'wrong_password') {
        setError(t('deleteAccount.wrongPassword'));
      }
    } catch {
      setError(t('deleteAccount.errorMessage'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: t('deleteAccount.confirmTitle') }} />
      <SafeAreaView style={[styles.safe, webScroll.safe]} edges={['bottom']}>
        <KeyboardAvoidingView
          style={[styles.flex, webScroll.safe]}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            style={webScroll.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={[styles.message, textStartStyle()]}>
              {t('deleteAccount.enterPassword')}
            </Text>

            <View style={authFormStyles.field}>
              <Text style={[authFormStyles.label, textStartStyle()]}>
                {t('auth.password')}
              </Text>
              <TextInput
                style={authFormStyles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!submitting}
                textContentType="password"
              />
            </View>

            {error ? (
              <Text style={[authFormStyles.error, textStartStyle()]}>{error}</Text>
            ) : null}

            <Pressable
              style={[
                styles.deleteButton,
                (submitting || password.trim() === '') && styles.deleteButtonDisabled,
              ]}
              onPress={() => void handleDelete()}
              disabled={submitting || password.trim() === ''}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.deleteButtonText}>
                  {t('deleteAccount.secondConfirmButton')}
                </Text>
              )}
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
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
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  message: {
    fontSize: 16,
    color: '#444',
    lineHeight: 22,
  },
  deleteButton: {
    backgroundColor: '#C62828',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    marginTop: 8,
  },
  deleteButtonDisabled: {
    opacity: 0.6,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
