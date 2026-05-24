import type { User } from 'firebase/auth';

import { saveUserProfile } from '../firebase/firestore';
import { useAuthStore, type UserProfileState } from '../store/authStore';
import { splitDisplayName } from './profileDisplay';

export async function persistOAuthProfile(user: User): Promise<UserProfileState> {
  const fromName = splitDisplayName(user.displayName);
  const profile: UserProfileState = {
    firstName: fromName.firstName,
    lastName: fromName.lastName,
    country: '',
    phone: '',
  };

  await saveUserProfile(user.uid, profile, user.email ?? undefined);
  useAuthStore.getState().setUserProfile(profile);
  return profile;
}
