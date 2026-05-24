import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { authFormStyles } from '../../src/components/auth/authFormStyles';
import { useEmailAuth } from '../../src/hooks/useEmailAuth';
import { useAlignStart, textStartStyle } from '../../src/utils/rtl';
import { webScreenScrollStyles } from '../../src/utils/webScroll';

export default function OnboardingForgotPasswordScreen() {
  const { t } = useTranslation();
  const webScroll = webScreenScrollStyles();
  const router = useRouter();
  const textStart = useAlignStart();
  const { email, setEmail, loading, error, successMessage, forgotPassword } = useEmailAuth();

  return (
    <SafeAreaView style={[authFormStyles.safe, webScroll.safe]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={[authFormStyles.flex, webScroll.safe]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={webScroll.scroll}
          contentContainerStyle={authFormStyles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[authFormStyles.title, textStartStyle()]}>{t('auth.forgotPassword')}</Text>
          <Text style={[authFormStyles.subtitle, textStartStyle()]}>
            {t('auth.subtitle')}
          </Text>

          <View style={authFormStyles.field}>
            <Text style={[authFormStyles.label, textStartStyle()]}>{t('auth.email')}</Text>
            <TextInput
              style={authFormStyles.input}
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

          {error ? (
            <Text style={[authFormStyles.error, textStartStyle()]} accessibilityRole="alert">
              {error}
            </Text>
          ) : null}

          {successMessage ? (
            <Text style={[authFormStyles.success, textStartStyle()]} accessibilityRole="text">
              {successMessage}
            </Text>
          ) : null}

          <Pressable
            style={[authFormStyles.primaryButton, loading && authFormStyles.primaryDisabled]}
            onPress={() => void forgotPassword()}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={authFormStyles.primaryButtonText}>{t('auth.forgotPassword')}</Text>
            )}
          </Pressable>

          <Pressable
            style={authFormStyles.backLink}
            onPress={() => router.back()}
            disabled={loading}
          >
            <Text style={authFormStyles.backText}>{t('auth.backToLogin')}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
