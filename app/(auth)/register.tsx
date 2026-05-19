import { useRouter } from 'expo-router';
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

import { useEmailAuth } from '../../src/hooks/useEmailAuth';
import { useAlignStart, textStartStyle } from '../../src/utils/rtl';

export default function RegisterScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const textStart = useAlignStart();
  const {
    email,
    setEmail,
    password,
    setPassword,
    loading,
    error,
    successMessage,
    signIn,
    register,
    forgotPassword,
  } = useEmailAuth();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.title, textStartStyle()]}>{t('auth.title')}</Text>
          <Text style={[styles.subtitle, textStartStyle()]}>
            {t('auth.subtitle')}
          </Text>

          <View style={styles.field}>
            <Text style={[styles.label, textStartStyle()]}>{t('auth.email')}</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              autoComplete="email"
              editable={!loading}
              textAlign={textStart}
              placeholder={t('auth.emailPlaceholder')}
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, textStartStyle()]}>
              {t('auth.password')}
            </Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="password"
              autoComplete="password"
              editable={!loading}
              textAlign={textStart}
              placeholder={t('auth.passwordPlaceholder')}
              placeholderTextColor="#999"
            />
          </View>

          <Pressable
            style={styles.forgotLink}
            onPress={() => void forgotPassword()}
            disabled={loading}
          >
            <Text style={[styles.forgotText, textStartStyle()]}>
              {t('auth.forgotPassword')}
            </Text>
          </Pressable>

          {error ? (
            <Text
              style={[styles.error, textStartStyle()]}
              accessibilityRole="alert"
            >
              {error}
            </Text>
          ) : null}

          {successMessage ? (
            <Text style={[styles.success, textStartStyle()]} accessibilityRole="text">
              {successMessage}
            </Text>
          ) : null}

          <View style={styles.actions}>
            <Pressable
              style={[styles.button, styles.primaryButton]}
              onPress={() => void signIn()}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>{t('auth.signIn')}</Text>
              )}
            </Pressable>

            <Pressable
              style={[styles.button, styles.secondaryButton]}
              onPress={() => void register()}
              disabled={loading}
            >
              <Text style={styles.secondaryButtonText}>
                {t('auth.createAccount')}
              </Text>
            </Pressable>
          </View>

          <Pressable
            style={styles.backLink}
            onPress={() => router.back()}
            disabled={loading}
          >
            <Text style={styles.backText}>{t('auth.backToLogin')}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  forgotLink: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  forgotText: {
    fontSize: 14,
    color: '#4285F4',
  },
  error: {
    fontSize: 14,
    color: '#C62828',
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
  },
  success: {
    fontSize: 14,
    color: '#2E7D32',
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
  },
  actions: {
    gap: 12,
    marginTop: 8,
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
  backLink: {
    alignSelf: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  backText: {
    fontSize: 15,
    color: '#666',
  },
});
