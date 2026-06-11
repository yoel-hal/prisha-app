import { router } from 'expo-router';
import type { TFunction } from 'i18next';
import { Platform } from 'react-native';

import {
  isEmailPasswordUser,
  reauthenticateWithPassword,
  WrongPasswordError,
} from '../firebase/auth';
import { useAuthStore } from '../store/authStore';
import { showToast } from './toast';
import { showAlert } from './alert';

let deleteAccountConfirmed = false;

export function markDeleteAccountConfirmed(): void {
  deleteAccountConfirmed = true;
}

export function consumeDeleteAccountConfirmed(): boolean {
  const confirmed = deleteAccountConfirmed;
  deleteAccountConfirmed = false;
  return confirmed;
}

function handleRequiresReauth(t: TFunction): void {
  if (isEmailPasswordUser()) {
    markDeleteAccountConfirmed();
    router.push('/settings/delete-account-reauth');
    return;
  }

  showToast(t('deleteAccount.reauthMessage'));
}

export async function performDeleteAccount(t: TFunction): Promise<void> {
  const result = await useAuthStore.getState().deleteAccount(t);
  if (result === 'requires_reauth') {
    handleRequiresReauth(t);
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
      showToast(t('deleteAccount.wrongPassword'));
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
