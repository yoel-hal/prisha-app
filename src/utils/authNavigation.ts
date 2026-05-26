import type { useRouter } from 'expo-router';
import type { User } from 'firebase/auth';

import { getUserDocument } from '../firebase/firestore';

type AppRouter = ReturnType<typeof useRouter>;

export async function navigateAfterSignIn(
  router: AppRouter,
  user: User,
): Promise<void> {
  const doc = await getUserDocument(user.uid);
  if (doc?.onboardingComplete === true) {
    router.replace('/calendar');
    return;
  }
  router.replace('/onboarding/profile');
}
