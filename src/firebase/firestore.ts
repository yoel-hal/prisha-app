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
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
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
import { db } from './config';

const SETTINGS_DOC_ID = 'default';
const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type UserRole = 'owner' | 'partner';

export interface UserDocument {
  email: string;
  coupleId: string | null;
  role: UserRole | null;
}

export interface CoupleDocument {
  createdAt: string;
  members: string[];
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
  const data = snapshot.data();
  return {
    email: typeof data.email === 'string' ? data.email : '',
    coupleId: typeof data.coupleId === 'string' ? data.coupleId : null,
    role:
      data.role === 'owner' || data.role === 'partner' ? data.role : null,
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

  const userDoc: UserDocument = {
    email: normalizedEmail,
    coupleId: null,
    role: null,
  };
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
  const coupleDoc: CoupleDocument = {
    createdAt: new Date().toISOString(),
    members: [userId],
  };
  const ref = await addDoc(collection(db, 'couples'), coupleDoc);
  const coupleId = ref.id;

  await setDoc(userRef(userId), {
    email: normalizeEmail(email),
    coupleId,
    role: 'owner',
  });

  return coupleId;
}

export async function invitePartner(
  coupleId: string,
  partnerEmail: string,
): Promise<void> {
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

export async function getPendingOutgoingInvite(
  coupleId: string,
): Promise<{ inviteId: string; partnerEmail: string } | null> {
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
    };
  }

  return null;
}

export async function checkPendingInvite(
  email: string,
): Promise<{ inviteId: string; coupleId: string } | null> {
  const normalizedEmail = normalizeEmail(email);
  const q = query(
    collectionGroup(db, 'invites'),
    where('partnerEmail', '==', normalizedEmail),
    where('status', '==', 'pending'),
  );
  const snapshot = await getDocs(q);
  const now = Date.now();

  for (const document of snapshot.docs) {
    const data = document.data() as CoupleInvite;
    if (new Date(data.expiresAt).getTime() < now) {
      continue;
    }

    const coupleId = document.ref.parent.parent?.id;
    if (coupleId) {
      return { inviteId: document.id, coupleId };
    }
  }

  return null;
}

export async function acceptInvite(
  userId: string,
  inviteId: string,
  coupleId: string,
): Promise<void> {
  const userSnapshot = await getDoc(userRef(userId));
  if (!userSnapshot.exists()) {
    throw new Error('User document not found');
  }

  const userEmail = normalizeEmail(
    typeof userSnapshot.data().email === 'string'
      ? userSnapshot.data().email
      : '',
  );
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
  if (!Array.isArray(members) || members.length >= 2) {
    throw new Error('Couple already has two members');
  }
  if (members.includes(userId)) {
    throw new Error('User is already a member of this couple');
  }

  const existingUser = await getUserDocument(userId);
  if (existingUser?.coupleId && existingUser.coupleId !== coupleId) {
    await disconnectCouple(userId, existingUser.coupleId);
  }

  const batch = writeBatch(db);
  batch.update(coupleRef(coupleId), {
    members: arrayUnion(userId),
  });
  batch.set(
    userRef(userId),
    {
      email: userEmail,
      coupleId,
      role: 'partner',
    },
    { merge: true },
  );
  batch.update(inviteRef(coupleId, inviteId), {
    status: 'accepted',
  });
  await batch.commit();
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
      { coupleId: null, role: null },
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
    { coupleId: null, role: null },
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
