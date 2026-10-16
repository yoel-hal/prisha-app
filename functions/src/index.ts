import { compare } from 'bcryptjs';
import * as admin from 'firebase-admin';
import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore';
import { initializeApp } from 'firebase-admin/app';
import { onCall, HttpsError } from 'firebase-functions/v2/https';

initializeApp();

const db = getFirestore();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 60 * 60 * 1000;

function getClientIp(rawRequest: {
  ip?: string;
  headers: Record<string, string | string[] | undefined>;
}): string {
  const forwarded = rawRequest.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0]?.trim() ?? 'unknown';
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0]?.split(',')[0]?.trim() ?? 'unknown';
  }
  return rawRequest.ip ?? 'unknown';
}

function rateLimitDocId(ip: string): string {
  return ip.replace(/[^a-zA-Z0-9_-]/g, '_');
}

async function enforceRateLimit(ip: string): Promise<void> {
  const ref = db.collection('adminRateLimits').doc(rateLimitDocId(ip));
  const now = Date.now();

  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    const data = snapshot.data() as
      | { attempts: number; windowStart: Timestamp }
      | undefined;

    if (!data) {
      transaction.set(ref, {
        attempts: 1,
        windowStart: Timestamp.fromMillis(now),
      });
      return;
    }

    const windowStartMs = data.windowStart.toMillis();
    if (now - windowStartMs > WINDOW_MS) {
      transaction.set(ref, {
        attempts: 1,
        windowStart: Timestamp.fromMillis(now),
      });
      return;
    }

    if (data.attempts >= MAX_ATTEMPTS) {
      throw new HttpsError(
        'resource-exhausted',
        'Too many PIN attempts. Try again later.',
      );
    }

    transaction.update(ref, {
      attempts: FieldValue.increment(1),
    });
  });
}

export { aggregateStats } from './aggregateStats';
export { inboundSupportEmail } from './inboundSupportEmail';
export { broadcastMessage } from './broadcastMessage';
export { sendSupportReply } from './sendSupportReply';

export const verifyAdminPin = onCall(async (request) => {
  const ip = getClientIp(request.rawRequest);
  await enforceRateLimit(ip);

  const pin = request.data?.pin;
  if (typeof pin !== 'string' || !/^\d{6}$/.test(pin)) {
    return { success: false };
  }

  const pinHash = process.env.ADMIN_PIN_HASH;
  if (!pinHash) {
    throw new HttpsError('failed-precondition', 'Admin PIN is not configured.');
  }

  const success = await compare(pin, pinHash);
  return { success };
});

export const setAdminClaim = onCall(async (request) => {
  const uid = request.data?.uid;
  const secret = request.data?.secret;

  if (typeof uid !== 'string' || uid.trim().length === 0) {
    throw new HttpsError('invalid-argument', 'A valid uid is required.');
  }

  if (typeof secret !== 'string' || secret.length === 0) {
    throw new HttpsError('invalid-argument', 'A valid secret is required.');
  }

  const setupSecret = process.env.ADMIN_SETUP_SECRET;
  if (!setupSecret) {
    throw new HttpsError(
      'failed-precondition',
      'ADMIN_SETUP_SECRET is not configured.',
    );
  }

  if (secret !== setupSecret) {
    throw new HttpsError('permission-denied', 'Invalid setup secret.');
  }

  try {
    await admin.auth().setCustomUserClaims(uid, { admin: true });
    return { success: true };
  } catch {
    throw new HttpsError('internal', 'Failed to set admin claim.');
  }
});
