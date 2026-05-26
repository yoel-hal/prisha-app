import {
  addDoc,
  arrayRemove,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type FieldValue,
  type Unsubscribe,
} from 'firebase/firestore';

import type {
  CalendarSettings,
  Chumrot,
  HebrewDate,
  Minhag,
  NotificationLeadHours,
  NotificationSettings,
  Period,
  UserSettings,
} from '../calculations/types';
const DEFAULT_EVENT_TITLE = 'פרישה';
import { db } from './config';

const SETTINGS_DOC_ID = 'main';

const DEFAULT_ONBOARDING_NOTIFICATIONS: NotificationSettings = {
  enabled: false,
  leadHours: 24,
  onahBeinonit: true,
  haflaga: true,
  yomHaChodesh: true,
};

const DEFAULT_ONBOARDING_CALENDAR: CalendarSettings = {
  syncEnabled: false,
  eventTitle: DEFAULT_EVENT_TITLE,
  syncedEventIds: {},
};

export type OnboardingLanguage = 'he' | 'en';

export interface CompleteOnboardingData {
  email: string;
  language: OnboardingLanguage;
  minhag: Minhag;
  chumrot: Chumrot;
  country: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export type UserRole = 'owner' | 'partner';

export interface UserDocument {
  email: string;
  firstName: string;
  lastName: string;
  country: string;
  phone: string;
  language: string;
  createdAt: string;
  coupleId: string | null;
  role: string;
  onboardingComplete: boolean;
  minhag?: Minhag;
  chumrot?: Chumrot;
}

export type UserProfileFields = Pick<
  UserDocument,
  'firstName' | 'lastName' | 'country' | 'phone'
>;

function mapChumrot(data: unknown): Chumrot | undefined {
  if (!data || typeof data !== 'object') {
    return undefined;
  }
  const record = data as Record<string, unknown>;
  return {
    kavuah: record.kavuah === true,
    veshetEinah: record.veshetEinah === true,
    onahBeinonitIfHaflaga: record.onahBeinonitIfHaflaga === true,
  };
}

function mapUserDocument(data: DocumentData): UserDocument {
  const minhag = data.minhag;
  return {
    email: typeof data.email === 'string' ? data.email : '',
    firstName: typeof data.firstName === 'string' ? data.firstName : '',
    lastName: typeof data.lastName === 'string' ? data.lastName : '',
    country: typeof data.country === 'string' ? data.country : '',
    phone: typeof data.phone === 'string' ? data.phone : '',
    language: typeof data.language === 'string' ? data.language : '',
    createdAt: typeof data.createdAt === 'string' ? data.createdAt : '',
    coupleId: typeof data.coupleId === 'string' ? data.coupleId : null,
    role: typeof data.role === 'string' ? data.role : '',
    onboardingComplete: data.onboardingComplete === true,
    minhag: typeof minhag === 'string' ? (minhag as Minhag) : undefined,
    chumrot: mapChumrot(data.chumrot),
  };
}

function defaultUserDocument(email: string): UserDocument {
  return {
    email: normalizeEmail(email),
    firstName: '',
    lastName: '',
    country: '',
    phone: '',
    language: '',
    createdAt: new Date().toISOString(),
    coupleId: null,
    role: '',
    onboardingComplete: false,
  };
}

export interface CoupleDocument {
  members: string[];
  createdAt: FieldValue | string;
}

export interface PartnerAccess {
  token: string;
  pinHash: string;
  createdAt: string;
  partnerLastSeen: string | null;
  isActive: boolean;
  ownerName: string;
  coupleId: string;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function userRef(userId: string) {
  return doc(db, 'users', userId);
}

function coupleRef(coupleId: string) {
  return doc(db, 'couples', coupleId);
}

function partnerAccessRef(userId: string) {
  return doc(db, 'users', userId, 'partnerAccess', 'current');
}

function partnerTokenRef(token: string) {
  return doc(db, 'partnerTokens', token);
}

function periodsRef(coupleId: string) {
  return collection(db, 'couples', coupleId, 'periods');
}

function settingsRef(coupleId: string) {
  return doc(db, 'couples', coupleId, 'settings', SETTINGS_DOC_ID);
}

function isHebrewDate(value: unknown): value is HebrewDate {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record.year === 'number' &&
    typeof record.month === 'number' &&
    typeof record.day === 'number'
  );
}

function mapPeriod(id: string, data: DocumentData): Period {
  const dateHebrew = data.dateHebrew;
  if (
    typeof data.dateGregorian !== 'string' ||
    typeof data.onah !== 'string' ||
    typeof data.createdAt !== 'string' ||
    typeof data.createdBy !== 'string' ||
    !isHebrewDate(dateHebrew)
  ) {
    throw new Error(`Invalid period document: ${id}`);
  }

  return {
    id,
    dateGregorian: data.dateGregorian,
    dateHebrew,
    onah: data.onah === 'night' ? 'night' : 'day',
    notes: typeof data.notes === 'string' ? data.notes : undefined,
    createdAt: data.createdAt,
    createdBy: data.createdBy,
  };
}

function parseLeadHours(value: unknown): NotificationLeadHours {
  if (value === 12 || value === 48) {
    return value;
  }
  return 24;
}

function mapNotifications(data: DocumentData): NotificationSettings {
  const raw =
    data.notifications && typeof data.notifications === 'object'
      ? (data.notifications as Record<string, unknown>)
      : {};

  return {
    enabled: raw.enabled === true,
    leadHours: parseLeadHours(raw.leadHours),
    onahBeinonit: raw.onahBeinonit !== false,
    haflaga: raw.haflaga !== false,
    yomHaChodesh: raw.yomHaChodesh !== false,
  };
}

function mapCalendar(data: DocumentData): CalendarSettings {
  const raw =
    data.calendar && typeof data.calendar === 'object'
      ? (data.calendar as Record<string, unknown>)
      : {};

  const syncedRaw =
    raw.syncedEventIds && typeof raw.syncedEventIds === 'object'
      ? (raw.syncedEventIds as Record<string, unknown>)
      : {};

  const syncedEventIds: Record<string, string> = {};
  for (const [vesetId, eventId] of Object.entries(syncedRaw)) {
    if (typeof eventId === 'string') {
      syncedEventIds[vesetId] = eventId;
    }
  }

  return {
    syncEnabled: raw.syncEnabled === true,
    eventTitle:
      typeof raw.eventTitle === 'string' && raw.eventTitle.length > 0
        ? raw.eventTitle
        : DEFAULT_EVENT_TITLE,
    syncedEventIds,
  };
}

function mapSettings(data: DocumentData): UserSettings {
  const chumrot = data.chumrot;
  const minhag = data.minhag;
  if (typeof minhag !== 'string') {
    throw new Error('Invalid settings document: missing minhag');
  }

  const chumrotRecord =
    chumrot && typeof chumrot === 'object'
      ? (chumrot as Record<string, unknown>)
      : {};

  return {
    minhag: minhag as UserSettings['minhag'],
    chumrot: {
      kavuah: chumrotRecord.kavuah === true,
      veshetEinah: chumrotRecord.veshetEinah === true,
      onahBeinonitIfHaflaga: chumrotRecord.onahBeinonitIfHaflaga === true,
    },
    notifications: mapNotifications(data),
    calendar: mapCalendar(data),
  };
}

export async function addPeriod(
  coupleId: string,
  period: Omit<Period, 'id'>,
): Promise<string> {
  const data = {
    ...period,
    notes: period.notes ?? null,
  };
  const ref = await addDoc(periodsRef(coupleId), data);
  return ref.id;
}

export async function getPeriods(coupleId: string): Promise<Period[]> {
  const q = query(periodsRef(coupleId), orderBy('dateGregorian', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((document) => mapPeriod(document.id, document.data()));
}

export async function deletePeriod(
  coupleId: string,
  periodId: string,
): Promise<void> {
  await deleteDoc(doc(periodsRef(coupleId), periodId));
}

export function subscribeToPeriods(
  coupleId: string,
  callback: (periods: Period[]) => void,
): Unsubscribe {
  const q = query(periodsRef(coupleId), orderBy('dateGregorian', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const periods = snapshot.docs.map((document) =>
      mapPeriod(document.id, document.data()),
    );
    callback(periods);
  });
}

export async function getSettings(
  coupleId: string,
): Promise<UserSettings | null> {
  const snapshot = await getDoc(settingsRef(coupleId));
  if (!snapshot.exists()) {
    return null;
  }
  return mapSettings(snapshot.data());
}

export async function saveSettings(
  coupleId: string,
  settings: UserSettings,
): Promise<void> {
  await setDoc(settingsRef(coupleId), settings, { merge: true });
}

export async function getUserDocument(
  userId: string,
): Promise<UserDocument | null> {
  const snapshot = await getDoc(userRef(userId));
  if (!snapshot.exists()) {
    return null;
  }
  return mapUserDocument(snapshot.data());
}

export async function updateUserCountryAndLanguage(
  userId: string,
  country: string,
  language: OnboardingLanguage,
): Promise<void> {
  await updateDoc(userRef(userId), {
    country: country.trim(),
    language,
  });
}

export async function saveUserProfile(
  userId: string,
  profile: UserProfileFields & { language?: string },
  email?: string,
): Promise<UserDocument> {
  if (email) {
    await ensureUserDocument(userId, email);
  }

  const existing = await getUserDocument(userId);
  const payload: Record<string, string> = {
    firstName: profile.firstName.trim(),
    lastName: profile.lastName.trim(),
    country: profile.country.trim(),
    phone: profile.phone.trim(),
  };

  if (profile.language !== undefined) {
    payload.language = profile.language;
  }

  await setDoc(userRef(userId), payload, { merge: true });

  const updated = await getUserDocument(userId);
  if (updated) {
    return updated;
  }

  return {
    ...(existing ?? defaultUserDocument('')),
    ...payload,
    coupleId: existing?.coupleId ?? null,
    role: existing?.role ?? '',
    email: existing?.email ?? '',
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    onboardingComplete: existing?.onboardingComplete ?? false,
  };
}

export async function ensureUserDocument(
  userId: string,
  email: string,
): Promise<UserDocument> {
  const normalizedEmail = normalizeEmail(email);
  const existing = await getUserDocument(userId);

  if (existing) {
    if (existing.email !== normalizedEmail) {
      await setDoc(userRef(userId), { email: normalizedEmail }, { merge: true });
      return { ...existing, email: normalizedEmail };
    }
    return existing;
  }

  const userDoc = defaultUserDocument(normalizedEmail);
  await setDoc(userRef(userId), userDoc);
  return userDoc;
}

export async function ensureCoupleForUser(
  userId: string,
  email: string,
): Promise<string> {
  const userDoc = await ensureUserDocument(userId, email);
  if (userDoc.coupleId) {
    return userDoc.coupleId;
  }
  return createCouple(userId, email);
}

export async function createCouple(
  userId: string,
  email: string,
): Promise<string> {
  const newCoupleRef = doc(collection(db, 'couples'));
  const coupleId = newCoupleRef.id;

  const coupleData = {
    members: [userId],
    createdAt: serverTimestamp(),
  };

  console.log('[createCouple] writing couple document', { coupleId, coupleData });

  await setDoc(newCoupleRef, coupleData);

  const written = await getDoc(newCoupleRef);
  const writtenMembers = written.data()?.members;

  if (
    !written.exists() ||
    !Array.isArray(writtenMembers) ||
    !writtenMembers.includes(userId)
  ) {
    console.error('[createCouple] verification failed', {
      coupleId,
      exists: written.exists(),
      data: written.data(),
    });
    throw new Error('Failed to create couple document with members field');
  }

  await setDoc(userRef(userId), {
    email: normalizeEmail(email),
    coupleId,
    role: 'owner',
  });

  console.log('[createCouple] success', { coupleId, members: writtenMembers });

  return coupleId;
}

/**
 * Persists onboarding choices, creates the couple workspace, and marks onboarding complete.
 */
export async function completeOnboarding(
  userId: string,
  data: CompleteOnboardingData,
): Promise<string> {
  console.log('[completeOnboarding] data', data);

  const newCoupleRef = doc(collection(db, 'couples'));
  const coupleId = newCoupleRef.id;
  const normalizedCountry = data.country.trim();

  await setDoc(
    userRef(userId),
    {
      email: normalizeEmail(data.email),
      language: data.language,
      country: normalizedCountry,
      firstName: data.firstName?.trim() ?? '',
      lastName: data.lastName?.trim() ?? '',
      phone: data.phone?.trim() ?? '',
      onboardingComplete: true,
      createdAt: serverTimestamp(),
    },
    { merge: true },
  );

  await setDoc(newCoupleRef, {
    members: [userId],
    createdAt: serverTimestamp(),
  });

  await setDoc(doc(db, 'couples', coupleId, 'settings', SETTINGS_DOC_ID), {
    minhag: data.minhag,
    chumrot: data.chumrot,
    notifications: DEFAULT_ONBOARDING_NOTIFICATIONS,
    calendar: DEFAULT_ONBOARDING_CALENDAR,
  });

  await updateDoc(userRef(userId), {
    coupleId,
    role: 'owner',
  });

  return coupleId;
}

export function generatePartnerToken(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  const array = new Uint8Array(12);
  crypto.getRandomValues(array);
  for (const byte of array) {
    result += chars[byte % chars.length];
  }
  return result;
}

export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function createPartnerAccess(
  userId: string,
  ownerName: string,
  pin: string,
): Promise<string> {
  const ownerDoc = await getUserDocument(userId);
  if (!ownerDoc?.coupleId) {
    throw new Error('Owner must have a couple before creating partner access');
  }

  const existing = await getPartnerAccess(userId);
  if (existing?.token) {
    await deleteDoc(partnerTokenRef(existing.token));
  }

  const token = generatePartnerToken();
  const pinHash = await hashPin(pin);
  const access: PartnerAccess = {
    token,
    pinHash,
    createdAt: new Date().toISOString(),
    partnerLastSeen: null,
    isActive: true,
    ownerName,
    coupleId: ownerDoc.coupleId,
  };
  await setDoc(partnerAccessRef(userId), access);
  await setDoc(partnerTokenRef(token), { ownerId: userId });
  return token;
}

export async function validatePartnerAccess(
  token: string,
  pin: string,
): Promise<{ ownerId: string; ownerName: string; coupleId: string } | null> {
  const normalizedToken = token.trim().toUpperCase();

  const tokenSnap = await getDoc(partnerTokenRef(normalizedToken));
  if (!tokenSnap.exists()) return null;

  const { ownerId } = tokenSnap.data() as { ownerId: string };
  if (!ownerId) return null;

  const pinHash = await hashPin(pin);
  const accessSnap = await getDoc(partnerAccessRef(ownerId));
  if (!accessSnap.exists()) return null;

  const data = accessSnap.data() as PartnerAccess;
  if (!data.isActive) return null;
  if (data.token !== normalizedToken) return null;
  if (data.pinHash !== pinHash) return null;
  if (!data.coupleId) return null;

  await setDoc(
    partnerAccessRef(ownerId),
    { partnerLastSeen: new Date().toISOString() },
    { merge: true },
  );

  return {
    ownerId,
    ownerName: data.ownerName,
    coupleId: data.coupleId,
  };
}

export async function checkPartnerAccessValid(ownerId: string): Promise<boolean> {
  const snap = await getDoc(partnerAccessRef(ownerId));
  if (!snap.exists()) return false;
  const data = snap.data() as PartnerAccess;
  return data.isActive === true;
}

export async function revokePartnerAccess(userId: string): Promise<void> {
  const accessSnap = await getDoc(partnerAccessRef(userId));
  const token = accessSnap.exists()
    ? (accessSnap.data() as PartnerAccess).token
    : null;

  await setDoc(partnerAccessRef(userId), { isActive: false }, { merge: true });

  if (token) {
    await deleteDoc(partnerTokenRef(token));
  }
}

export async function getPartnerAccess(
  userId: string,
): Promise<PartnerAccess | null> {
  const snap = await getDoc(partnerAccessRef(userId));
  if (!snap.exists()) return null;
  return snap.data() as PartnerAccess;
}

const FIRESTORE_BATCH_LIMIT = 500;

async function deleteAllDocsInCollection(
  colRef: ReturnType<typeof collection>,
): Promise<void> {
  const snapshot = await getDocs(colRef);
  if (snapshot.empty) {
    return;
  }

  let batch = writeBatch(db);
  let operationCount = 0;

  for (const docSnap of snapshot.docs) {
    batch.delete(docSnap.ref);
    operationCount += 1;
    if (operationCount >= FIRESTORE_BATCH_LIMIT) {
      await batch.commit();
      batch = writeBatch(db);
      operationCount = 0;
    }
  }

  if (operationCount > 0) {
    await batch.commit();
  }
}

async function deleteCoupleWithSubcollections(coupleId: string): Promise<void> {
  await deleteAllDocsInCollection(periodsRef(coupleId));
  await deleteAllDocsInCollection(
    collection(db, 'couples', coupleId, 'invites'),
  );
  await deleteAllDocsInCollection(
    collection(db, 'couples', coupleId, 'settings'),
  );
  await deleteDoc(coupleRef(coupleId));
}

export async function deleteAllUserData(
  userId: string,
  coupleId: string,
): Promise<void> {
  if (coupleId) {
    const coupleSnapshot = await getDoc(coupleRef(coupleId));
    if (coupleSnapshot.exists()) {
      const members = Array.isArray(coupleSnapshot.data().members)
        ? (coupleSnapshot.data().members as string[])
        : [];

      if (members.length <= 1) {
        await deleteCoupleWithSubcollections(coupleId);
      } else {
        await updateDoc(coupleRef(coupleId), {
          members: arrayRemove(userId),
        });
      }
    }
  }

  await revokePartnerAccess(userId);
  await setDoc(
    userRef(userId),
    { coupleId: null, role: '' },
    { merge: true },
  );
}
