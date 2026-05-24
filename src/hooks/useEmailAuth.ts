import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { saveUserProfile } from '../firebase/firestore';
import {
  registerWithEmail,
  sendPasswordReset,
  signInWithEmail,
} from '../firebase/auth';
import { useAuthStore } from '../store/authStore';
import { navigateAfterSignIn } from '../utils/authNavigation';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function useEmailAuth() {
  const { t } = useTranslation();
  const router = useRouter();
  const setUserProfile = useAuthStore((state) => state.setUserProfile);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [country, setCountry] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccessMessage(null);
  }, []);

  const validateCredentials = useCallback((): string | null => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      return t('auth.errorEmptyFields');
    }
    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      return t('auth.errorInvalidEmail');
    }
    if (password.length < 6) {
      return t('auth.errorWeakPassword');
    }
    return null;
  }, [email, password, t]);

  const validateRegistration = useCallback((): string | null => {
    const credentialsError = validateCredentials();
    if (credentialsError) {
      return credentialsError;
    }
    if (!firstName.trim()) {
      return t('auth.errorFirstNameRequired');
    }
    if (!country.trim()) {
      return t('auth.errorCountryRequired');
    }
    if (!phone.trim()) {
      return t('auth.errorPhoneRequired');
    }
    if (password !== confirmPassword) {
      return t('auth.passwordMismatch');
    }
    return null;
  }, [validateCredentials, firstName, country, phone, confirmPassword, password, t]);

  const validateEmailOnly = useCallback((): string | null => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      return t('auth.errorEmailRequired');
    }
    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      return t('auth.errorInvalidEmail');
    }
    return null;
  }, [email, t]);

  const signIn = useCallback(async () => {
    clearMessages();
    const validationError = validateCredentials();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    const result = await signInWithEmail(email.trim(), password);
    setLoading(false);

    if (!result.success || !result.user) {
      if (result.error) {
        setError(result.error);
      }
      return;
    }

    navigateAfterSignIn(router, result.user);
  }, [clearMessages, validateCredentials, email, password, router]);

  const register = useCallback(async () => {
    clearMessages();
    const validationError = validateRegistration();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    const result = await registerWithEmail(email.trim(), password);
    if (!result.success || !result.user) {
      setLoading(false);
      if (result.error) {
        setError(result.error);
      }
      return;
    }

    const profile = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      country: country.trim(),
      phone: phone.trim(),
    };

    try {
      await saveUserProfile(
        result.user.uid,
        profile,
        result.user.email ?? undefined,
      );
      setUserProfile(profile);
      router.replace('/onboarding/minhag');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.errorRegistrationFailed'));
    } finally {
      setLoading(false);
    }
  }, [
    clearMessages,
    validateRegistration,
    email,
    password,
    firstName,
    lastName,
    country,
    phone,
    setUserProfile,
    router,
    t,
  ]);

  const forgotPassword = useCallback(async () => {
    clearMessages();
    const validationError = validateEmailOnly();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    const result = await sendPasswordReset(email.trim());
    setLoading(false);

    if (result.success) {
      setSuccessMessage(t('auth.passwordResetSent'));
      return;
    }

    if (result.error) {
      setError(result.error);
    }
  }, [clearMessages, validateEmailOnly, email, t]);

  return {
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
    successMessage,
    signIn,
    register,
    forgotPassword,
  };
}
