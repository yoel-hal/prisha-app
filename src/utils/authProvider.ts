import type { User } from 'firebase/auth';

export function isPasswordProvider(user: User | null | undefined): boolean {
  return user?.providerData[0]?.providerId === 'password';
}
