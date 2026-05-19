import AsyncStorage from '@react-native-async-storage/async-storage';

export const ONBOARDING_COMPLETE_KEY = 'onboarding_complete';

export async function isOnboardingComplete(): Promise<boolean> {
  const value = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
  return value === 'true';
}

export async function setOnboardingComplete(): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
}
