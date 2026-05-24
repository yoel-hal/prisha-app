import { useCallback, useEffect, useRef, useState } from 'react';
import type { User } from 'firebase/auth';

import {
  ensureUserDocument,
  getUserDocument,
  saveUserProfile,
  type UserProfileFields,
} from '../firebase/firestore';
import { useAuthStore, type UserProfileState } from '../store/authStore';
import { hasProfileData, splitDisplayName } from '../utils/profileDisplay';

function profileFromStore(
  firstName: string,
  lastName: string,
  country: string,
  phone: string,
): UserProfileState {
  return { firstName, lastName, country, phone };
}

function profileFromUser(user: User): UserProfileState {
  const fromName = splitDisplayName(user.displayName);
  return {
    firstName: fromName.firstName,
    lastName: fromName.lastName,
    country: '',
    phone: '',
  };
}

function mergeProfile(
  current: UserProfileState,
  doc: UserProfileState,
): UserProfileState {
  return {
    firstName: doc.firstName.trim() || current.firstName,
    lastName: doc.lastName.trim() || current.lastName,
    country: doc.country.trim() || current.country,
    phone: doc.phone.trim() || current.phone,
  };
}

export function useProfileForm() {
  const user = useAuthStore((state) => state.user);
  const setUserProfile = useAuthStore((state) => state.setUserProfile);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [country, setCountry] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const loadedUidRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      loadedUidRef.current = null;
      return;
    }

    if (loadedUidRef.current === user.uid) {
      setLoading(false);
      return;
    }

    loadedUidRef.current = user.uid;
    let cancelled = false;
    setLoading(true);

    const {
      firstName: storedFirstName,
      lastName: storedLastName,
      country: storedCountry,
      phone: storedPhone,
    } = useAuthStore.getState();
    const stored = profileFromStore(
      storedFirstName,
      storedLastName,
      storedCountry,
      storedPhone,
    );
    const initial = hasProfileData(stored)
      ? stored
      : profileFromUser(user);

    setFirstName(initial.firstName);
    setLastName(initial.lastName);
    setCountry(initial.country);
    setPhone(initial.phone);

    void (async () => {
      try {
        await ensureUserDocument(user.uid, user.email ?? '');
        const doc = await getUserDocument(user.uid);
        if (!cancelled && doc) {
          const merged = mergeProfile(initial, {
            firstName: doc.firstName,
            lastName: doc.lastName,
            country: doc.country,
            phone: doc.phone,
          });

          setFirstName(merged.firstName);
          setLastName(merged.lastName);
          setCountry(merged.country);
          setPhone(merged.phone);
          setUserProfile(merged);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.uid, setUserProfile]);

  const getProfileFields = useCallback(
    (): UserProfileFields => ({
      firstName,
      lastName,
      country,
      phone,
    }),
    [firstName, lastName, country, phone],
  );

  const persistProfile = useCallback(
    async (language?: string): Promise<boolean> => {
      if (!user) {
        return false;
      }

      const profile = getProfileFields();
      setSaving(true);

      try {
        await saveUserProfile(
          user.uid,
          language !== undefined ? { ...profile, language } : profile,
          user.email ?? undefined,
        );
        setUserProfile(profile);
        return true;
      } finally {
        setSaving(false);
      }
    },
    [user, getProfileFields, setUserProfile],
  );

  return {
    firstName,
    setFirstName,
    lastName,
    setLastName,
    country,
    setCountry,
    phone,
    setPhone,
    loading,
    saving,
    getProfileFields,
    persistProfile,
  };
}
