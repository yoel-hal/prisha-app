import Busboy from 'busboy';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { onRequest } from 'firebase-functions/v2/https';
import type { IncomingMessage } from 'http';

const db = getFirestore();

interface InboundEmailFields {
  from: string;
  subject: string;
  text: string;
}

function normalizeEmail(raw: string): string {
  const match = raw.match(/<([^>]+)>/);
  const email = (match?.[1] ?? raw).trim().toLowerCase();
  return email;
}

function parseMultipartForm(
  req: IncomingMessage & { headers: Record<string, string | string[] | undefined> },
): Promise<InboundEmailFields> {
  return new Promise((resolve, reject) => {
    const fields: Partial<InboundEmailFields> = {};
    const busboy = Busboy({ headers: req.headers });

    busboy.on('field', (name, value) => {
      if (name === 'from' || name === 'subject' || name === 'text') {
        fields[name] = value;
      }
    });

    busboy.on('finish', () => {
      if (!fields.from || !fields.subject || !fields.text) {
        reject(new Error('Missing required email fields: from, subject, or text'));
        return;
      }

      resolve({
        from: fields.from,
        subject: fields.subject,
        text: fields.text,
      });
    });

    busboy.on('error', reject);
    req.pipe(busboy);
  });
}

async function findUserIdByEmail(email: string): Promise<string | null> {
  const snapshot = await db
    .collection('users')
    .where('email', '==', email)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  return snapshot.docs[0]?.id ?? null;
}

async function findActiveThreadId(userEmail: string): Promise<string | null> {
  const snapshot = await db
    .collection('supportThreads')
    .where('userEmail', '==', userEmail)
    .orderBy('lastMessageAt', 'desc')
    .limit(10)
    .get();

  const activeThread = snapshot.docs.find(
    (docSnap) => docSnap.data().status !== 'resolved',
  );

  return activeThread?.id ?? null;
}

async function appendMessage(
  threadId: string,
  body: string,
  status: 'new' | 'open',
): Promise<void> {
  const now = Timestamp.now();
  const threadRef = db.collection('supportThreads').doc(threadId);

  await threadRef.collection('messages').add({
    body,
    sentBy: 'user',
    sentAt: now,
    readAt: null,
  });

  await threadRef.update({
    lastMessageAt: now,
    status,
    unreadByAdmin: true,
  });
}

async function createThread(
  userEmail: string,
  userId: string | null,
  subject: string,
  body: string,
): Promise<string> {
  const now = Timestamp.now();
  const threadRef = db.collection('supportThreads').doc();

  await threadRef.set({
    userId,
    userEmail,
    subject,
    status: 'new',
    createdAt: now,
    lastMessageAt: now,
    unreadByAdmin: true,
  });

  await threadRef.collection('messages').add({
    body,
    sentBy: 'user',
    sentAt: now,
    readAt: null,
  });

  return threadRef.id;
}

export const inboundSupportEmail = onRequest(async (req, res) => {
  console.log('[inboundSupportEmail] enter');

  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    console.log('[inboundSupportEmail] exit — method not allowed');
    return;
  }

  try {
    const { from, subject, text } = await parseMultipartForm(req);
    const userEmail = normalizeEmail(from);
    const body = text.trim();

    if (!body) {
      res.status(400).send('Empty message body');
      console.log('[inboundSupportEmail] exit — empty body');
      return;
    }

    const [userId, existingThreadId] = await Promise.all([
      findUserIdByEmail(userEmail),
      findActiveThreadId(userEmail),
    ]);

    if (existingThreadId) {
      const existingThread = await db
        .collection('supportThreads')
        .doc(existingThreadId)
        .get();
      const currentStatus = existingThread.data()?.status;
      const nextStatus = currentStatus === 'new' ? 'new' : 'open';

      await appendMessage(existingThreadId, body, nextStatus);
      console.log('[inboundSupportEmail] exit — appended to thread', existingThreadId);
      res.status(200).send('OK');
      return;
    }

    const threadId = await createThread(userEmail, userId, subject.trim(), body);
    console.log('[inboundSupportEmail] exit — created thread', threadId);
    res.status(200).send('OK');
  } catch (error) {
    console.error('[inboundSupportEmail] error', error);
    res.status(500).send('Internal Server Error');
    console.log('[inboundSupportEmail] exit — error');
  }
});
