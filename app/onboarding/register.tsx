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
import { persistOAuthProfile } from '../../src/utils/persistOAuthProfile';
import { useAlignStart, textStartStyle } from '../../src/utils/rtl';
import { webScreenScrollStyles } from '../../src/utils/webScroll';

export default function OnboardingRegisterScreen() {
  const { t } = useTranslation();
  const webScroll = webScreenScrollStyles();
  const router = useRouter();
  const textStart = useAlignStart();
  const {
    firstName,
    setFirstName,
    lastName,
    setLastName,
    country,
    setCountry,
    phone,
    setPhone,
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    loading,
    error,
    register,
  } = useEmailAuth();

  async function handleOAuthRegister(user: User) {
    const profile = await persistOAuthProfile(user);
    if (!profile.country.trim() || !profile.phone.trim()) {
      router.replace('/onboarding/profile');
      return;
    }
    router.replace('/onboarding/minhag');
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
          <Text style={[authFormStyles.title, textStartStyle()]}>{t('auth.createAccount')}</Text>

          <View style={authFormStyles.field}>
            <Text style={[authFormStyles.label, textStartStyle()]}>
              {t('onboarding.firstName')}
            </Text>
            <TextInput
              style={authFormStyles.input}
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
              autoCorrect={false}
              textContentType="givenName"
              autoComplete="given-name"
              editable={!loading}
              textAlign={textStart}
              placeholder={t('onboarding.firstNamePlaceholder')}
              placeholderTextColor="#999"
            />
          </View>

          <View style={authFormStyles.field}>
            <Text style={[authFormStyles.label, textStartStyle()]}>
              {t('onboarding.lastName')}
            </Text>
            <TextInput
              style={authFormStyles.input}
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
              autoCorrect={false}
              textContentType="familyName"
              autoComplete="family-name"
              editable={!loading}
              textAlign={textStart}
              placeholder={t('onboarding.lastNamePlaceholder')}
              placeholderTextColor="#999"
            />
          </View>

          <View style={authFormStyles.field}>
            <Text style={[authFormStyles.label, textStartStyle()]}>
              {t('onboarding.country')}
            </Text>
            <TextInput
              style={authFormStyles.input}
              value={country}
              onChangeText={setCountry}
              autoCapitalize="words"
              autoCorrect={false}
              editable={!loading}
              textAlign={textStart}
              placeholder={t('onboarding.countryPlaceholder')}
              placeholderTextColor="#999"
            />
          </View>

          <View style={authFormStyles.field}>
            <Text style={[authFormStyles.label, textStartStyle()]}>
              {t('onboarding.phone')}
            </Text>
            <TextInput
              style={authFormStyles.input}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoCorrect={false}
              textContentType="telephoneNumber"
              autoComplete="tel"
              editable={!loading}
              textAlign={textStart}
              placeholder={t('onboarding.phonePlaceholder')}
              placeholderTextColor="#999"
            />
          </View>

          <AuthDivider label={t('auth.orContinueWith')} />

          <OAuthSignInButtons onSuccess={handleOAuthRegister} disabled={loading} />

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
              textContentType="newPassword"
              autoComplete="new-password"
              editable={!loading}
              textAlign={textStart}
              placeholder={t('auth.passwordPlaceholder')}
              placeholderTextColor="#999"
            />
          </View>

          <View style={authFormStyles.field}>
            <Text style={[authFormStyles.label, textStartStyle()]}>
              {t('auth.confirmPassword')}
            </Text>
            <TextInput
              style={authFormStyles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="newPassword"
              autoComplete="new-password"
              editable={!loading}
              textAlign={textStart}
              placeholder={t('auth.passwordPlaceholder')}
              placeholderTextColor="#999"
            />
          </View>

          {error ? (
            <Text style={[authFormStyles.error, textStartStyle()]} accessibilityRole="alert">
              {error}
            </Text>
          ) : null}

          <Pressable
            style={[authFormStyles.primaryButton, loading && authFormStyles.primaryDisabled]}
            onPress={() => void register()}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={authFormStyles.primaryButtonText}>{t('auth.createAccount')}</Text>
            )}
          </Pressable>

          <View style={authFormStyles.linkRow}>
            <Text style={authFormStyles.linkText}>{t('auth.alreadyHaveAccount')}</Text>
            <Pressable onPress={() => router.push('/onboarding/login')} disabled={loading}>
              <Text style={authFormStyles.linkAction}>{t('auth.signIn')}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
