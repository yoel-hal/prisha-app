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
import type { User } from 'firebase/auth';

import { AuthDivider } from '../../src/components/auth/AuthDivider';
import { authFormStyles } from '../../src/components/auth/authFormStyles';
import { OAuthSignInButtons } from '../../src/components/auth/OAuthSignInButtons';
import { useEmailAuth } from '../../src/hooks/useEmailAuth';
import { navigateAfterSignIn } from '../../src/utils/authNavigation';
import { useAlignStart, textStartStyle } from '../../src/utils/rtl';
import { webScreenScrollStyles } from '../../src/utils/webScroll';

export default function OnboardingLoginScreen() {
  const { t } = useTranslation();
  const webScroll = webScreenScrollStyles();
  const router = useRouter();
  const textStart = useAlignStart();
  const { email, setEmail, password, setPassword, loading, error, signIn } = useEmailAuth();

  function handleOAuthLogin(user: User) {
    void navigateAfterSignIn(router, user);
  }

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
          <Text style={[authFormStyles.title, textStartStyle()]}>{t('auth.signIn')}</Text>

          <OAuthSignInButtons onSuccess={handleOAuthLogin} disabled={loading} />

          <AuthDivider label={t('auth.or')} />

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

          <View style={authFormStyles.field}>
            <Text style={[authFormStyles.label, textStartStyle()]}>{t('auth.password')}</Text>
            <TextInput
              style={authFormStyles.input}
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
            style={authFormStyles.forgotLink}
            onPress={() => router.push('/onboarding/forgot-password')}
            disabled={loading}
          >
            <Text style={[authFormStyles.forgotText, textStartStyle()]}>
              {t('auth.forgotPassword')}
            </Text>
          </Pressable>


          {error ? (
            <Text style={[authFormStyles.error, textStartStyle()]} accessibilityRole="alert">
              {error}
            </Text>
          ) : null}

          <Pressable
            style={[authFormStyles.primaryButton, loading && authFormStyles.primaryDisabled]}
            onPress={() => void signIn()}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={authFormStyles.primaryButtonText}>{t('auth.signIn')}</Text>
            )}
          </Pressable>

          <View style={authFormStyles.linkRow}>
            <Text style={authFormStyles.linkText}>{t('auth.noAccount')}</Text>
            <Pressable onPress={() => router.push('/onboarding/register')} disabled={loading}>
              <Text style={authFormStyles.linkAction}>{t('auth.createAccount')}</Text>
            </Pressable>
          </View>
          <View style={authFormStyles.linkRow}>
            <Text style={authFormStyles.linkText}>{t('auth.JoinAsPartner')}</Text>
            <Pressable onPress={() => router.push('/join')}>
              <Text style={authFormStyles.linkAction}>{t('auth.partnerLogin')}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
