import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  type DocumentData,
  type Unsubscribe,
} from 'firebase/firestore';

import type { HebrewDate, Period, UserSettings } from '../calculations/types';
import { db } from './config';

const SETTINGS_DOC_ID = 'default';

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
