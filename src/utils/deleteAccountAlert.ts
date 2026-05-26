import { router } from 'expo-router';
import type { TFunction } from 'i18next';
import { Platform } from 'react-native';

import {
  deleteUserAccount,
  isEmailPasswordUser,
  reauthenticateWithPassword,
  RequiresReauthError,
  WrongPasswordError,
} from '../firebase/auth';
import { deleteAllUserData } from '../firebase/firestore';
import {
  DEFAULT_CALENDAR_SETTINGS,
  DEFAULT_NOTIFICATION_SETTINGS,
  useAuthStore,
  useOnboardingStore,
  usePeriodsStore,
  useSettingsStore,
} from '../store';
import { showAlert } from './alert';

const DEFAULT_CHUMROT = {
  kavuah: false,
  veshetEinah: false,
  onahBeinonitIfHaflaga: false,
} as const;

let deleteAccountConfirmed = false;

export function markDeleteAccountConfirmed(): void {
  deleteAccountConfirmed = true;
}

export function consumeDeleteAccountConfirmed(): boolean {
  const confirmed = deleteAccountConfirmed;
  deleteAccountConfirmed = false;
  return confirmed;
}

function clearAllStores(): void {
  useAuthStore.getState().setFirestoreOnboardingComplete(false);
  useAuthStore.getState().setUser(null);
  usePeriodsStore.setState({ periods: [], isLoading: true });
  useSettingsStore.setState({
    minhag: 'ashkenaz',
    chumrot: DEFAULT_CHUMROT,
    notifications: DEFAULT_NOTIFICATION_SETTINGS,
    calendar: DEFAULT_CALENDAR_SETTINGS,
  });
  useOnboardingStore.getState().reset();
}

export async function performDeleteAccount(t: TFunction): Promise<void> {
  const user = useAuthStore.getState().user;
  if (!user) {
    return;
  }

  const coupleId = useAuthStore.getState().coupleId ?? '';

  try {
    await deleteAllUserData(user.uid, coupleId);
    await deleteUserAccount();
    clearAllStores();
    router.replace('/onboarding/welcome');
  } catch (error) {
    if (
      error instanceof RequiresReauthError ||
      (error instanceof Error && error.message === 'REQUIRES_REAUTH')
    ) {
      showAlert(t('deleteAccount.reauthMessage'));
      return;
    }
    showAlert(t('deleteAccount.errorMessage'));
  }
}

function isWrongPasswordError(error: unknown): boolean {
  return (
    error instanceof WrongPasswordError ||
    (error instanceof Error && error.message === 'WRONG_PASSWORD')
  );
}

async function reauthenticateAndDelete(t: TFunction, password: string): Promise<void> {
  try {
    await reauthenticateWithPassword(password);
  } catch (error) {
    if (isWrongPasswordError(error)) {
      showAlert(t('deleteAccount.wrongPassword'));
      return;
    }
    throw error;
  }

  await performDeleteAccount(t);
}

async function promptPasswordOnWeb(t: TFunction): Promise<void> {
  const password = window.prompt(t('deleteAccount.enterPassword'));
  if (password === null || password.trim() === '') {
    return;
  }

  await reauthenticateAndDelete(t, password);
}

async function proceedToDeleteAfterConfirm(t: TFunction): Promise<void> {
  if (!isEmailPasswordUser()) {
    await performDeleteAccount(t);
    return;
  }

  if (Platform.OS === 'web') {
    await promptPasswordOnWeb(t);
    return;
  }

  markDeleteAccountConfirmed();
  router.push('/settings/delete-account-reauth');
}

function showSecondDeleteConfirm(t: TFunction): void {
  showAlert(
    t('deleteAccount.secondConfirmTitle'),
    t('deleteAccount.secondConfirmMessage'),
    [
      { text: t('deleteAccount.cancel'), style: 'cancel' },
      {
        text: t('deleteAccount.secondConfirmButton'),
        style: 'destructive',
        onPress: () => {
          void proceedToDeleteAfterConfirm(t);
        },
      },
    ],
  );
}

export function showDeleteAccountAlert(t: TFunction): void {
  showAlert(
    t('deleteAccount.confirmTitle'),
    t('deleteAccount.confirmMessage'),
    [
      { text: t('deleteAccount.cancel'), style: 'cancel' },
      {
        text: t('deleteAccount.confirmButton'),
        style: 'destructive',
        onPress: () => showSecondDeleteConfirm(t),
      },
    ],
  );
}

export async function submitDeleteAccountPassword(
  t: TFunction,
  password: string,
): Promise<'wrong_password' | 'empty' | 'done'> {
  if (password.trim() === '') {
    return 'empty';
  }

  try {
    await reauthenticateWithPassword(password);
  } catch (error) {
    if (isWrongPasswordError(error)) {
      return 'wrong_password';
    }
    throw error;
  }

  await performDeleteAccount(t);
  return 'done';
}
