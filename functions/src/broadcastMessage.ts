import sgMail from '@sendgrid/mail';
import { getMessaging } from 'firebase-admin/messaging';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

const db = getFirestore();
const messaging = getMessaging();

const SETTINGS_DOC_ID = 'main';
const FCM_BATCH_SIZE = 500;

type Minhag = 'ashkenaz' | 'sfarad' | 'chabad' | 'teimani' | 'yireim';
const VALID_MINHAGIM: Minhag[] = ['ashkenaz', 'sfarad', 'chabad', 'teimani', 'yireim'];

type BroadcastChannels = { push: boolean; inApp: boolean; email: boolean };
type BroadcastTargetFilter = {
  type: 'all' | 'byMinhag' | 'byCountry';
  value?: string;
};

interface BroadcastDocument {
  titleHe: string;
  titleEn: string;
  bodyHe: string;
  bodyEn: string;
  channels: BroadcastChannels;
  targetFilter: BroadcastTargetFilter;
  scheduledAt: Timestamp | null;
  status: string;
}

interface MatchedUser {
  uid: string;
  email: string | null;
  language: 'he' | 'en';
  fcmToken: string | null;
}

function getAdminUid(): string {
  const adminUid = process.env.ADMIN_UID;
  if (!adminUid) {
    throw new HttpsError('failed-precondition', 'ADMIN_UID is not configured.');
  }
  return adminUid;
}

function assertSendGridConfigured(): void {
  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.SUPPORT_FROM_EMAIL;
  if (!apiKey || !fromEmail) {
    throw new HttpsError(
      'failed-precondition',
      'SendGrid is not configured (SENDGRID_API_KEY / SUPPORT_FROM_EMAIL).',
    );
  }
  sgMail.setApiKey(apiKey);
}

function isMinhag(value: unknown): value is Minhag {
  return typeof value === 'string' && VALID_MINHAGIM.includes(value as Minhag);
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

function extractFcmToken(data: FirebaseFirestore.DocumentData): string | null {
  if (typeof data.fcmToken === 'string' && data.fcmToken.length > 0) {
    return data.fcmToken;
  }

  if (Array.isArray(data.fcmTokens) && data.fcmTokens.length > 0) {
    const first = data.fcmTokens[0];
    return typeof first === 'string' && first.length > 0 ? first : null;
  }

  return null;
}

function mapUserDoc(
  uid: string,
  data: FirebaseFirestore.DocumentData,
): MatchedUser {
  const email =
    typeof data.email === 'string' && data.email.trim().length > 0
      ? data.email.trim().toLowerCase()
      : null;
  const language = data.language === 'en' ? 'en' : 'he';

  return {
    uid,
    email,
    language,
    fcmToken: extractFcmToken(data),
  };
}

async function fetchMatchingUsers(
  targetFilter: BroadcastTargetFilter,
): Promise<MatchedUser[]> {
  if (targetFilter.type === 'byCountry') {
    const country =
      typeof targetFilter.value === 'string' ? targetFilter.value.trim() : '';
    if (!country) {
      throw new HttpsError('invalid-argument', 'Country filter value is required.');
    }

    const snapshot = await db
      .collection('users')
      .where('country', '==', country)
      .get();
    return snapshot.docs.map((docSnap) => mapUserDoc(docSnap.id, docSnap.data()));
  }

  const snapshot = await db.collection('users').get();
  const minhagCache = new Map<string, Minhag | null>();

  if (targetFilter.type === 'all') {
    return snapshot.docs.map((docSnap) => mapUserDoc(docSnap.id, docSnap.data()));
  }

  const minhagValue =
    typeof targetFilter.value === 'string' ? targetFilter.value : '';
  if (!isMinhag(minhagValue)) {
    throw new HttpsError('invalid-argument', 'Minhag filter value is required.');
  }

  const matched: MatchedUser[] = [];
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const minhag = await resolveMinhag(data, minhagCache);
    if (minhag === minhagValue) {
      matched.push(mapUserDoc(docSnap.id, data));
    }
  }

  return matched;
}

async function sendPushNotifications(
  users: MatchedUser[],
  titleHe: string,
  titleEn: string,
  bodyHe: string,
  bodyEn: string,
): Promise<void> {
  const hebrewTokens = users
    .filter((user) => user.fcmToken !== null && user.language !== 'en')
    .map((user) => user.fcmToken as string);
  const englishTokens = users
    .filter((user) => user.fcmToken !== null && user.language === 'en')
    .map((user) => user.fcmToken as string);

  const batches: Array<{ tokens: string[]; title: string; body: string }> = [
    { tokens: hebrewTokens, title: titleHe, body: bodyHe },
    { tokens: englishTokens, title: titleEn, body: bodyEn },
  ];

  for (const { tokens, title, body } of batches) {
    for (let index = 0; index < tokens.length; index += FCM_BATCH_SIZE) {
      const batchTokens = tokens.slice(index, index + FCM_BATCH_SIZE);
      if (batchTokens.length === 0) {
        continue;
      }

      await messaging.sendEachForMulticast({
        tokens: batchTokens,
        notification: { title, body },
      });
    }
  }
}

async function sendEmailNotifications(
  users: MatchedUser[],
  titleHe: string,
  titleEn: string,
  bodyHe: string,
  bodyEn: string,
): Promise<void> {
  const recipients = users.filter((user) => user.email !== null);
  if (recipients.length === 0) {
    return;
  }

  assertSendGridConfigured();
  const fromEmail = process.env.SUPPORT_FROM_EMAIL!;

  await Promise.all(
    recipients.map((user) => {
      const isEnglish = user.language === 'en';
      return sgMail.send({
        to: user.email as string,
        from: fromEmail,
        subject: isEnglish ? titleEn : titleHe,
        text: isEnglish ? bodyEn : bodyHe,
      });
    }),
  );
}

async function writeInAppMessages(
  broadcastId: string,
  users: MatchedUser[],
  titleHe: string,
  titleEn: string,
  bodyHe: string,
  bodyEn: string,
): Promise<void> {
  const now = Timestamp.now();
  const batchSize = 400;

  for (let index = 0; index < users.length; index += batchSize) {
    const batch = db.batch();
    const slice = users.slice(index, index + batchSize);

    for (const user of slice) {
      const activeRef = db
        .collection('users')
        .doc(user.uid)
        .collection('appMessages')
        .doc('active');
      batch.set(activeRef, {
        broadcastId,
        titleHe,
        titleEn,
        bodyHe,
        bodyEn,
        createdAt: now,
        readAt: null,
      });
    }

    await batch.commit();
  }
}

export const broadcastMessage = onCall(async (request) => {
  console.log('[broadcastMessage] enter');

  const adminUid = getAdminUid();
  if (!request.auth || request.auth.uid !== adminUid) {
    console.log('[broadcastMessage] exit — unauthorized');
    throw new HttpsError('permission-denied', 'Admin access required.');
  }

  const broadcastId = request.data?.broadcastId;
  if (typeof broadcastId !== 'string' || broadcastId.length === 0) {
    throw new HttpsError('invalid-argument', 'broadcastId is required.');
  }

  const broadcastRef = db.collection('broadcasts').doc(broadcastId);

  try {
    const broadcastSnap = await broadcastRef.get();
    if (!broadcastSnap.exists) {
      throw new HttpsError('not-found', 'Broadcast not found.');
    }

    const broadcast = broadcastSnap.data() as BroadcastDocument;
    const { titleHe, titleEn, bodyHe, bodyEn, channels, targetFilter, scheduledAt } =
      broadcast;

    if (broadcast.status === 'sent') {
      console.log('[broadcastMessage] exit — already sent', broadcastId);
      return { success: true, recipientCount: broadcastSnap.data()?.recipientCount ?? 0 };
    }

    if (scheduledAt && scheduledAt.toMillis() > Date.now()) {
      throw new HttpsError(
        'failed-precondition',
        'Broadcast is scheduled for a future time.',
      );
    }

    const users = await fetchMatchingUsers(targetFilter);
    const recipientCount = users.length;

    if (channels.push) {
      await sendPushNotifications(users, titleHe, titleEn, bodyHe, bodyEn);
    }

    if (channels.email) {
      await sendEmailNotifications(users, titleHe, titleEn, bodyHe, bodyEn);
    }

    if (channels.inApp) {
      await writeInAppMessages(
        broadcastId,
        users,
        titleHe,
        titleEn,
        bodyHe,
        bodyEn,
      );
    }

    const now = Timestamp.now();
    await broadcastRef.update({
      status: 'sent',
      sentAt: now,
      recipientCount,
    });

    console.log('[broadcastMessage] exit — sent', {
      broadcastId,
      recipientCount,
      channels,
      targetFilter,
    });

    return { success: true, recipientCount };
  } catch (error) {
    if (!(error instanceof HttpsError)) {
      await broadcastRef.update({ status: 'failed' }).catch(() => undefined);
    }
    console.error('[broadcastMessage] exit — failed', broadcastId, error);
    throw error;
  }
});
