import type { User } from 'firebase/auth';

import type { UserProfileState } from '../store/authStore';
import { useAuthStore } from '../store/authStore';
import { hasProfileData } from './profileDisplay';

export type IncompleteOnboardingHref =
  | '/onboarding/profile'
  | '/onboarding/minhag'
  | '/onboarding/chumrot';

/** Resume path for logged-in users who have not finished onboarding. */
export function getIncompleteOnboardingHref(
  profile: UserProfileState,
  hasSavedSettings: boolean,
  user: User | null,
): IncompleteOnboardingHref {
  if (!hasProfileData(profile)) {
    return '/onboarding/profile';
  }
  if (!hasSavedSettings) {
    return '/onboarding/minhag';
  }
  return '/onboarding/chumrot';
}

export function profileFromAuthStore(): UserProfileState {
  const { firstName, lastName, country, phone } = useAuthStore.getState();
  return { firstName, lastName, country, phone };
}
