import type { useRouter } from 'expo-router';
import type { User } from 'firebase/auth';

import { useOnboardingStore } from '../store/onboardingStore';
import {
  getIncompleteOnboardingHref,
  profileFromAuthStore,
} from './onboardingRoute';

type AppRouter = ReturnType<typeof useRouter>;

export function navigateAfterSignIn(router: AppRouter, user: User): void {
  const onboardingComplete = useOnboardingStore.getState().complete;
  if (onboardingComplete) {
    router.replace('/calendar');
    return;
  }
  router.replace(getIncompleteOnboardingHref(profileFromAuthStore(), false, user));
}
