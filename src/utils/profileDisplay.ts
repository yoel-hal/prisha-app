import type { UserProfileState } from '../store/authStore';

export function splitDisplayName(displayName: string | null | undefined): {
  firstName: string;
  lastName: string;
} {
  if (!displayName?.trim()) {
    return { firstName: '', lastName: '' };
  }
  const parts = displayName.trim().split(/\s+/);
  return {
    firstName: parts[0] ?? '',
    lastName: parts.slice(1).join(' '),
  };
}

export function hasProfileData(profile: UserProfileState): boolean {
  return (
    profile.firstName.trim().length > 0 && profile.country.trim().length > 0
  );
}

export function getProfileInitials(
  firstName: string,
  lastName: string,
  email: string,
): string {
  const first = firstName.trim();
  const last = lastName.trim();

  if (first || last) {
    const initials = `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase();
    if (initials) {
      return initials;
    }
  }

  return getEmailInitials(email);
}

export function getEmailInitials(email: string): string {
  const trimmed = email.trim();
  if (!trimmed) {
    return '?';
  }

  const local = trimmed.split('@')[0] ?? trimmed;
  const letters = local.replace(/[^a-zA-Z0-9\u0590-\u05FF]/g, '');

  if (letters.length >= 2) {
    return letters.slice(0, 2).toUpperCase();
  }
  if (letters.length === 1) {
    return letters.toUpperCase();
  }

  return trimmed.slice(0, 2).toUpperCase();
}

export function getDisplayFullName(firstName: string, lastName: string): string {
  return [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');
}
