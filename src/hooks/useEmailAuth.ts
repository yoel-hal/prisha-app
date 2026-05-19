import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  registerWithEmail,
  sendPasswordReset,
  signInWithEmail,
} from '../firebase/auth';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function useEmailAuth() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

    if (!result.success && result.error) {
      setError(result.error);
    }
  }, [clearMessages, validateCredentials, email, password]);

  const register = useCallback(async () => {
    clearMessages();
    const validationError = validateCredentials();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    const result = await registerWithEmail(email.trim(), password);
    setLoading(false);

    if (!result.success && result.error) {
      setError(result.error);
    }
  }, [clearMessages, validateCredentials, email, password]);

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
  };
}
