import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  collectionGroup,
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
  HebrewDate,
  NotificationLeadHours,
  NotificationSettings,
  Period,
  UserSettings,
} from '../calculations/types';
const DEFAULT_EVENT_TITLE = 'פרישה';
import { auth, db } from './config';

const SETTINGS_DOC_ID = 'default';
const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

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
}

export type UserProfileFields = Pick<
  UserDocument,
  'firstName' | 'lastName' | 'country' | 'phone'
>;

function mapUserDocument(data: DocumentData): UserDocument {
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
  };
}

export interface CoupleDocument {
  members: string[];
  createdAt: FieldValue | string;
}

export type InviteStatus = 'pending' | 'accepted' | 'declined' | 'expired';

export interface CoupleInvite {
  partnerEmail: string;
  status: InviteStatus;
  createdAt: string;
  expiresAt: string;
}

export interface CoupleMemberInfo {
  userId: string;
  email: string;
  role: string;
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

function invitesRef(coupleId: string) {
  return collection(db, 'couples', coupleId, 'invites');
}

function inviteRef(coupleId: string, inviteId: string) {
  return doc(db, 'couples', coupleId, 'invites', inviteId);
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

export async function invitePartner(
  coupleId: string,
  partnerEmail: string,
): Promise<void> {
  const coupleSnapshot = await getDoc(coupleRef(coupleId));
  const members = coupleSnapshot.data()?.members;

  if (
    !coupleSnapshot.exists() ||
    !Array.isArray(members) ||
    members.length === 0
  ) {
    throw new Error(
      'Couple document is missing members. Cannot send invite until the couple is fixed.',
    );
  }

  const normalizedPartnerEmail = normalizeEmail(partnerEmail);
  const now = new Date();
  const invite: CoupleInvite = {
    partnerEmail: normalizedPartnerEmail,
    status: 'pending',
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + INVITE_TTL_MS).toISOString(),
  };

  await addDoc(invitesRef(coupleId), invite);
}

export async function cancelInvite(
  coupleId: string,
  inviteId: string,
): Promise<void> {
  console.log('[cancelInvite] start', { coupleId, inviteId });
  try {
    await deleteDoc(inviteRef(coupleId, inviteId));
    console.log('[cancelInvite] success', { coupleId, inviteId });
  } catch (error) {
    console.error('[cancelInvite] error', { coupleId, inviteId, error });
    throw error;
  }
}

export async function getPendingOutgoingInvite(
  coupleId: string,
): Promise<{ inviteId: string; partnerEmail: string; expiresAt: string } | null> {
  const q = query(invitesRef(coupleId), where('status', '==', 'pending'));
  const snapshot = await getDocs(q);
  const now = Date.now();

  const sortedDocs = [...snapshot.docs].sort((a, b) => {
    const aTime = (a.data() as CoupleInvite).createdAt;
    const bTime = (b.data() as CoupleInvite).createdAt;
    return bTime.localeCompare(aTime);
  });

  for (const document of sortedDocs) {
    const data = document.data() as CoupleInvite;
    if (new Date(data.expiresAt).getTime() < now) {
      continue;
    }
    return {
      inviteId: document.id,
      partnerEmail: data.partnerEmail,
      expiresAt: data.expiresAt,
    };
  }

  return null;
}

/** Email used for invite queries — must match Firebase Auth token email for security rules. */
export function resolveInviteLookupEmail(fallbackEmail: string): string {
  const authEmail = auth.currentUser?.email?.trim();
  if (authEmail) {
    return normalizeEmail(authEmail);
  }
  return normalizeEmail(fallbackEmail);
}

export async function checkPendingInvite(
  email: string,
): Promise<{ inviteId: string; coupleId: string } | null> {
  const paramEmail = normalizeEmail(email);
  const queryEmail = resolveInviteLookupEmail(email);
  const authEmail = auth.currentUser?.email ?? null;

  console.log('[checkPendingInvite] start', {
    paramEmail,
    authEmail,
    queryEmail,
    authUid: auth.currentUser?.uid ?? null,
    emailsMatch: paramEmail === queryEmail,
  });

  if (!queryEmail) {
    console.warn(
      '[checkPendingInvite] no email available — auth.email and param are empty; cannot query invites',
    );
    return null;
  }

  if (paramEmail && paramEmail !== queryEmail) {
    console.warn(
      '[checkPendingInvite] param email differs from auth email; querying with auth email (required by security rules)',
      { paramEmail, queryEmail },
    );
  }

  try {
    const q = query(
      collectionGroup(db, 'invites'),
      where('partnerEmail', '==', queryEmail),
      where('status', '==', 'pending'),
    );

    console.log('[checkPendingInvite] running collectionGroup query on "invites"', {
      partnerEmail: queryEmail,
      status: 'pending',
    });

    const snapshot = await getDocs(q);
    const now = Date.now();

    console.log('[checkPendingInvite] query results', {
      size: snapshot.size,
      docs: snapshot.docs.map((document) => ({
        inviteId: document.id,
        path: document.ref.path,
        partnerEmail: (document.data() as CoupleInvite).partnerEmail,
        status: (document.data() as CoupleInvite).status,
        expiresAt: (document.data() as CoupleInvite).expiresAt,
        coupleId: document.ref.parent.parent?.id ?? null,
      })),
    });

    for (const document of snapshot.docs) {
      const data = document.data() as CoupleInvite;
      if (new Date(data.expiresAt).getTime() < now) {
        console.log('[checkPendingInvite] skipping expired invite', document.id);
        continue;
      }

      const coupleId = document.ref.parent.parent?.id;
      if (coupleId) {
        const result = { inviteId: document.id, coupleId };
        console.log('[checkPendingInvite] found pending invite', result);
        return result;
      }

      console.warn('[checkPendingInvite] invite missing coupleId parent', document.ref.path);
    }

    console.log('[checkPendingInvite] no valid pending invite');
    return null;
  } catch (error) {
    console.error('[checkPendingInvite] error', error);
    throw error;
  }
}

export async function acceptInvite(
  userId: string,
  inviteId: string,
  coupleId: string,
): Promise<void> {
  console.log('[acceptInvite] start', { userId, inviteId, coupleId });

  const userSnapshot = await getDoc(userRef(userId));
  if (!userSnapshot.exists()) {
    throw new Error('User document not found');
  }

  const authEmail = auth.currentUser?.email?.trim() ?? '';
  const docEmail =
    typeof userSnapshot.data().email === 'string' ? userSnapshot.data().email : '';
  const userEmail = normalizeEmail(authEmail || docEmail);

  console.log('[acceptInvite] resolved email', {
    authEmail: authEmail || null,
    docEmail: docEmail || null,
    userEmail,
  });

  if (!userEmail) {
    throw new Error('User email is required to accept an invite');
  }

  const inviteSnapshot = await getDoc(inviteRef(coupleId, inviteId));
  if (!inviteSnapshot.exists()) {
    throw new Error('Invite not found');
  }

  const invite = inviteSnapshot.data() as CoupleInvite;
  if (invite.status !== 'pending') {
    throw new Error('Invite is no longer pending');
  }
  if (new Date(invite.expiresAt).getTime() < Date.now()) {
    throw new Error('Invite has expired');
  }
  if (invite.partnerEmail !== userEmail) {
    throw new Error('Invite email does not match current user');
  }

  const coupleSnapshot = await getDoc(coupleRef(coupleId));
  if (!coupleSnapshot.exists()) {
    throw new Error('Couple not found');
  }

  const members = coupleSnapshot.data().members;
  if (!Array.isArray(members) || members.length === 0) {
    throw new Error(
      'Couple document is missing members. Update it in Firebase Console before accepting.',
    );
  }
  if (members.length >= 2) {
    throw new Error('Couple already has two members');
  }
  if (members.includes(userId)) {
    throw new Error('User is already a member of this couple');
  }

  const existingUser = await getUserDocument(userId);
  const oldCoupleId =
    existingUser?.coupleId && existingUser.coupleId !== coupleId
      ? existingUser.coupleId
      : null;
  let oldCoupleMembers: string[] = [];
  if (oldCoupleId) {
    const oldCoupleSnap = await getDoc(coupleRef(oldCoupleId));
    if (oldCoupleSnap.exists()) {
      const m = oldCoupleSnap.data().members;
      oldCoupleMembers = Array.isArray(m) ? (m as string[]) : [];
    }
  }

  console.log('[acceptInvite] adding member via arrayUnion', {
    coupleId,
    userId,
    existingMembers: members,
  });

  const batch = writeBatch(db);
  // Join new couple
  batch.update(coupleRef(coupleId), { members: arrayUnion(userId) });
  batch.set(
    userRef(userId),
    { email: userEmail, coupleId, role: 'partner' },
    { merge: true },
  );
  batch.update(inviteRef(coupleId, inviteId), { status: 'accepted' });
  // Atomically clean up old solo couple in the same batch
  if (oldCoupleId) {
    const remaining = oldCoupleMembers.filter((id) => id !== userId);
    if (remaining.length === 0) {
      batch.delete(coupleRef(oldCoupleId));
    } else {
      batch.update(coupleRef(oldCoupleId), { members: arrayRemove(userId) });
    }
  }

  try {
    await batch.commit();
    console.log('[acceptInvite] success', { userId, inviteId, coupleId, oldCoupleId });
  } catch (error) {
    console.error('[acceptInvite] batch commit failed', {
      userId,
      inviteId,
      coupleId,
      error,
    });
    throw error;
  }
}

export async function declineInvite(
  coupleId: string,
  inviteId: string,
): Promise<void> {
  await updateDoc(inviteRef(coupleId, inviteId), {
    status: 'declined',
  });
}

export async function disconnectCouple(
  userId: string,
  coupleId: string,
): Promise<void> {
  const coupleSnapshot = await getDoc(coupleRef(coupleId));
  if (!coupleSnapshot.exists()) {
    await setDoc(
      userRef(userId),
      { coupleId: null, role: '' },
      { merge: true },
    );
    return;
  }

  const members = Array.isArray(coupleSnapshot.data().members)
    ? (coupleSnapshot.data().members as string[])
    : [];
  const remainingMembers = members.filter((memberId) => memberId !== userId);

  const batch = writeBatch(db);
  batch.set(
    userRef(userId),
    { coupleId: null, role: '' },
    { merge: true },
  );

  if (remainingMembers.length === 0) {
    batch.delete(coupleRef(coupleId));
  } else {
    batch.update(coupleRef(coupleId), {
      members: arrayRemove(userId),
    });
  }

  await batch.commit();
}

export async function getCoupleMembers(
  coupleId: string,
): Promise<CoupleMemberInfo[]> {
  const coupleSnapshot = await getDoc(coupleRef(coupleId));
  if (!coupleSnapshot.exists()) {
    return [];
  }

  const members = Array.isArray(coupleSnapshot.data().members)
    ? (coupleSnapshot.data().members as string[])
    : [];

  const memberDocs = await Promise.all(
    members.map(async (memberId) => {
      const snapshot = await getDoc(userRef(memberId));
      if (!snapshot.exists()) {
        return {
          userId: memberId,
          email: '',
          role: '',
        };
      }
      const data = snapshot.data();
      return {
        userId: memberId,
        email: typeof data.email === 'string' ? data.email : '',
        role: typeof data.role === 'string' ? data.role : '',
      };
    }),
  );

  return memberDocs;
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
  await deleteAllDocsInCollection(invitesRef(coupleId));
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

  await setDoc(
    userRef(userId),
    { coupleId: null, role: '' },
    { merge: true },
  );
}
