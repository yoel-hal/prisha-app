import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const PARTNER_OWNER_ID_KEY = 'partner_owner_id';
const PARTNER_OWNER_NAME_KEY = 'partner_owner_name';
const PARTNER_COUPLE_ID_KEY = 'partner_couple_id';

async function store(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}

async function retrieve(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  }
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function remove(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
  } else {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      // ignore
    }
  }
}

export async function savePartnerSession(
  ownerId: string,
  ownerName: string,
  coupleId: string,
): Promise<void> {
  await Promise.all([
    store(PARTNER_OWNER_ID_KEY, ownerId),
    store(PARTNER_OWNER_NAME_KEY, ownerName),
    store(PARTNER_COUPLE_ID_KEY, coupleId),
  ]);
}

export async function loadPartnerSession(): Promise<{
  ownerId: string;
  ownerName: string;
  coupleId: string;
} | null> {
  const [ownerId, ownerName, coupleId] = await Promise.all([
    retrieve(PARTNER_OWNER_ID_KEY),
    retrieve(PARTNER_OWNER_NAME_KEY),
    retrieve(PARTNER_COUPLE_ID_KEY),
  ]);
  if (!ownerId || !ownerName || !coupleId) return null;
  return { ownerId, ownerName, coupleId };
}

export async function clearPartnerSession(): Promise<void> {
  await Promise.all([
    remove(PARTNER_OWNER_ID_KEY),
    remove(PARTNER_OWNER_NAME_KEY),
    remove(PARTNER_COUPLE_ID_KEY),
  ]);
}
