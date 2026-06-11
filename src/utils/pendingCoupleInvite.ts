import AsyncStorage from '@react-native-async-storage/async-storage';

const PENDING_INVITE_CODE_KEY = 'pending_couple_invite_code';

export async function savePendingCoupleInviteCode(code: string): Promise<void> {
  await AsyncStorage.setItem(PENDING_INVITE_CODE_KEY, code.trim().toUpperCase());
}

export async function loadPendingCoupleInviteCode(): Promise<string | null> {
  const value = await AsyncStorage.getItem(PENDING_INVITE_CODE_KEY);
  return value?.trim() ? value : null;
}

export async function clearPendingCoupleInviteCode(): Promise<void> {
  await AsyncStorage.removeItem(PENDING_INVITE_CODE_KEY);
}
