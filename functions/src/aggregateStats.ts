import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as logger from 'firebase-functions/logger';

const db = getFirestore();

type Minhag = 'ashkenaz' | 'sfarad' | 'chabad' | 'teimani';
type Platform = 'ios' | 'android' | 'web';

const VALID_MINHAGIM: Minhag[] = ['ashkenaz', 'sfarad', 'chabad', 'teimani'];
const VALID_PLATFORMS: Platform[] = ['ios', 'android', 'web'];
const SETTINGS_DOC_ID = 'main';
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export interface AdminStatsDocument {
  updatedAt: Timestamp;
  totalUsers: number;
  newUsersThisWeek: number;
  activeUsersLast30Days: number;
  byCountry: Record<string, number>;
  byMinhag: Record<Minhag, number>;
  coupleAdoptionRate: number;
  byPlatform: Record<Platform, number>;
}

function emptyMinhagCounts(): Record<Minhag, number> {
  return {
    ashkenaz: 0,
    sfarad: 0,
    chabad: 0,
    teimani: 0,
  };
}

function emptyPlatformCounts(): Record<Platform, number> {
  return {
    ios: 0,
    android: 0,
    web: 0,
  };
}

function toMillis(value: unknown): number | null {
  if (value instanceof Timestamp) {
    return value.toMillis();
  }
  if (
    value !== null &&
    typeof value === 'object' &&
    'toMillis' in value &&
    typeof (value as { toMillis: () => number }).toMillis === 'function'
  ) {
    return (value as { toMillis: () => number }).toMillis();
  }
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

function isMinhag(value: unknown): value is Minhag {
  return typeof value === 'string' && VALID_MINHAGIM.includes(value as Minhag);
}

function isPlatform(value: unknown): value is Platform {
  return typeof value === 'string' && VALID_PLATFORMS.includes(value as Platform);
}

async function resolveMinhag(
  userData: FirebaseFirestore.DocumentData,
  minhagCache: Map<string, Minhag | null>,
): Promise<Minhag | null> {
  if (isMinhag(userData.minhag)) {
    return userData.minhag;
  }

  const coupleId = userData.coupleId;
  if (typeof coupleId !== 'string' || coupleId.length === 0) {
    return null;
  }

  if (minhagCache.has(coupleId)) {
    return minhagCache.get(coupleId) ?? null;
  }

  const settingsSnapshot = await db
    .collection('couples')
    .doc(coupleId)
    .collection('settings')
    .doc(SETTINGS_DOC_ID)
    .get();

  const settingsMinhag = settingsSnapshot.data()?.minhag;
  const resolved = isMinhag(settingsMinhag) ? settingsMinhag : null;
  minhagCache.set(coupleId, resolved);
  return resolved;
}

export async function runAggregateStats(): Promise<AdminStatsDocument> {
  logger.info('[aggregateStats] enter');

  const now = Date.now();
  const weekAgo = now - WEEK_MS;
  const thirtyDaysAgo = now - THIRTY_DAYS_MS;

  const usersSnapshot = await db.collection('users').get();

  let newUsersThisWeek = 0;
  let activeUsersLast30Days = 0;
  let usersWithCouple = 0;
  const byCountry: Record<string, number> = {};
  const byMinhag = emptyMinhagCounts();
  const byPlatform = emptyPlatformCounts();
  const minhagCache = new Map<string, Minhag | null>();

  for (const userDoc of usersSnapshot.docs) {
    const data = userDoc.data();

    const createdAtMs = toMillis(data.createdAt);
    if (createdAtMs !== null && createdAtMs >= weekAgo) {
      newUsersThisWeek += 1;
    }

    const lastActiveMs =
      toMillis(data.lastActiveAt) ?? toMillis(data.lastLoginAt);
    if (lastActiveMs !== null && lastActiveMs >= thirtyDaysAgo) {
      activeUsersLast30Days += 1;
    }

    const country =
      typeof data.country === 'string' && data.country.trim().length > 0
        ? data.country.trim()
        : 'unknown';
    byCountry[country] = (byCountry[country] ?? 0) + 1;

    if (typeof data.coupleId === 'string' && data.coupleId.length > 0) {
      usersWithCouple += 1;
    }

    if (isPlatform(data.platform)) {
      byPlatform[data.platform] += 1;
    }

    const minhag = await resolveMinhag(data, minhagCache);
    if (minhag) {
      byMinhag[minhag] += 1;
    }
  }

  const totalUsers = usersSnapshot.size;
  const coupleAdoptionRate =
    totalUsers > 0
      ? Math.round((usersWithCouple / totalUsers) * 1000) / 10
      : 0;

  const stats: AdminStatsDocument = {
    updatedAt: Timestamp.now(),
    totalUsers,
    newUsersThisWeek,
    activeUsersLast30Days,
    byCountry,
    byMinhag,
    coupleAdoptionRate,
    byPlatform,
  };

  await db.collection('admin').doc('stats').set(stats, { merge: false });

  logger.info('[aggregateStats] exit', {
    totalUsers,
    newUsersThisWeek,
    activeUsersLast30Days,
    coupleAdoptionRate,
    countries: Object.keys(byCountry).length,
    minhagTotal: Object.values(byMinhag).reduce((sum, count) => sum + count, 0),
    platforms: byPlatform,
  });

  return stats;
}

export const aggregateStats = onSchedule(
  {
    schedule: '0 3 * * *',
    timeZone: 'UTC',
  },
  async () => {
    await runAggregateStats();
  },
);
