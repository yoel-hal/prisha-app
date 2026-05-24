import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const INVITE_PIN_KEY = 'owner_partner_invite_pin';

async function storePin(value: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.setItem(INVITE_PIN_KEY, value);
  } else {
    await SecureStore.setItemAsync(INVITE_PIN_KEY, value);
  }
}

async function retrievePin(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return localStorage.getItem(INVITE_PIN_KEY);
  }
  try {
    return await SecureStore.getItemAsync(INVITE_PIN_KEY);
  } catch {
    return null;
  }
}

async function removePin(): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.removeItem(INVITE_PIN_KEY);
  } else {
    try {
      await SecureStore.deleteItemAsync(INVITE_PIN_KEY);
    } catch {
      // ignore
    }
  }
}

export async function saveOwnerInvitePin(pin: string): Promise<void> {
  await storePin(pin);
}

export async function loadOwnerInvitePin(): Promise<string | null> {
  return retrievePin();
}

export async function clearOwnerInvitePin(): Promise<void> {
  await removePin();
}
