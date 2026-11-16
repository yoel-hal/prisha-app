import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  updateDoc,
  type DocumentData,
  type Unsubscribe,
} from 'firebase/firestore';

import type {
  CheckKey,
  CheckResult,
  HebrewDate,
  TaharaCycle,
  TaharaSettings,
} from '../calculations/types';
import { db } from './config';

const TAHARA_SETTINGS_DOC_ID = 'main';

export const DEFAULT_TAHARA_SETTINGS: TaharaSettings = {
  enabled: true,
  minDaysOverride: null,
  remindersEnabled: false,
};

export function taharaCyclesRef(coupleId: string) {
  return collection(db, 'couples', coupleId, 'taharaCycles');
}

export function taharaSettingsCollectionRef(coupleId: string) {
  return collection(db, 'couples', coupleId, 'taharaSettings');
}

function taharaSettingsRef(coupleId: string) {
  return doc(db, 'couples', coupleId, 'taharaSettings', TAHARA_SETTINGS_DOC_ID);
}

function isHebrewDate(value: unknown): value is HebrewDate {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const r = value as Record<string, unknown>;
  return typeof r.year === 'number' && typeof r.month === 'number' && typeof r.day === 'number';
}

const CHECK_KEY = /^[1-7]-(morning|evening)$/;

function mapCycle(id: string, data: DocumentData): TaharaCycle | null {
  if (!isHebrewDate(data.hefsekDateHebrew) || typeof data.hefsekDateGregorian !== 'string') {
    return null;
  }
  const checks: TaharaCycle['checks'] = {};
  if (data.checks && typeof data.checks === 'object') {
    for (const [key, value] of Object.entries(data.checks as Record<string, unknown>)) {
      if (CHECK_KEY.test(key) && (value === 'clean' || value === 'notClean')) {
        checks[key as CheckKey] = value;
      }
    }
  }
  return {
    id,
    periodId: typeof data.periodId === 'string' ? data.periodId : '',
    hefsekDateGregorian: data.hefsekDateGregorian,
    hefsekDateHebrew: data.hefsekDateHebrew,
    checks,
    status: data.status === 'restarted' ? 'restarted' : 'active',
    createdAt: typeof data.createdAt === 'string' ? data.createdAt : '',
    createdBy: typeof data.createdBy === 'string' ? data.createdBy : '',
  };
}

export function subscribeToTaharaCycles(
  coupleId: string,
  callback: (cycles: TaharaCycle[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    taharaCyclesRef(coupleId),
    (snapshot) => {
      callback(
        snapshot.docs
          .map((d) => mapCycle(d.id, d.data()))
          .filter((c): c is TaharaCycle => c !== null),
      );
    },
    onError,
  );
}

export async function addTaharaCycle(
  coupleId: string,
  cycle: Omit<TaharaCycle, 'id'>,
): Promise<string> {
  const ref = await addDoc(taharaCyclesRef(coupleId), cycle);
  return ref.id;
}

export async function setTaharaCheck(
  coupleId: string,
  cycleId: string,
  key: CheckKey,
  result: CheckResult | null,
  restart: boolean,
): Promise<void> {
  const ref = doc(taharaCyclesRef(coupleId), cycleId);
  const snapshot = await getDoc(ref);
  const current = snapshot.exists() ? mapCycle(snapshot.id, snapshot.data()) : null;
  const checks = { ...(current?.checks ?? {}) };
  if (result) {
    checks[key] = result;
  } else {
    delete checks[key];
  }
  await updateDoc(ref, { checks, status: restart ? 'restarted' : 'active' });
}

export async function clearNotCleanChecks(coupleId: string, cycle: TaharaCycle): Promise<void> {
  const checks = Object.fromEntries(
    Object.entries(cycle.checks).filter(([, value]) => value !== 'notClean'),
  );
  await updateDoc(doc(taharaCyclesRef(coupleId), cycle.id), { checks, status: 'active' });
}

export async function getTaharaSettings(coupleId: string): Promise<TaharaSettings> {
  const snapshot = await getDoc(taharaSettingsRef(coupleId));
  const raw = snapshot.exists() ? snapshot.data() : {};
  return {
    enabled: raw.enabled !== false,
    minDaysOverride: raw.minDaysOverride === 4 || raw.minDaysOverride === 5 ? raw.minDaysOverride : null,
    remindersEnabled: raw.remindersEnabled === true,
  };
}

export async function saveTaharaSettings(
  coupleId: string,
  settings: TaharaSettings,
): Promise<void> {
  await setDoc(taharaSettingsRef(coupleId), settings);
}
