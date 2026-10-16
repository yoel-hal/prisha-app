import sgMail from '@sendgrid/mail';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

const db = getFirestore();

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

export const sendSupportReply = onCall(async (request) => {
  console.log('[sendSupportReply] enter');

  const adminUid = getAdminUid();
  if (!request.auth || request.auth.uid !== adminUid) {
    console.log('[sendSupportReply] exit — unauthorized');
    throw new HttpsError('permission-denied', 'Admin access required.');
  }

  const threadId = request.data?.threadId;
  const body = request.data?.body;

  if (typeof threadId !== 'string' || threadId.length === 0) {
    throw new HttpsError('invalid-argument', 'threadId is required.');
  }

  if (typeof body !== 'string' || body.trim().length === 0) {
    throw new HttpsError('invalid-argument', 'body is required.');
  }

  const trimmedBody = body.trim();
  const threadRef = db.collection('supportThreads').doc(threadId);
  const threadSnap = await threadRef.get();

  if (!threadSnap.exists) {
    throw new HttpsError('not-found', 'Support thread not found.');
  }

  const threadData = threadSnap.data() as {
    userEmail?: string;
    subject?: string;
  };

  const userEmail = threadData.userEmail;
  const subject = threadData.subject;

  if (!userEmail || !subject) {
    throw new HttpsError('failed-precondition', 'Thread is missing email or subject.');
  }

  const now = Timestamp.now();

  await threadRef.collection('messages').add({
    body: trimmedBody,
    sentBy: 'admin',
    sentAt: now,
    readAt: null,
  });

  await threadRef.update({
    lastMessageAt: now,
    status: 'open',
    unreadByAdmin: false,
  });

  assertSendGridConfigured();

  const fromEmail = process.env.SUPPORT_FROM_EMAIL!;
  await sgMail.send({
    to: userEmail,
    from: fromEmail,
    subject: `Re: ${subject}`,
    text: trimmedBody,
  });

  console.log('[sendSupportReply] exit — reply sent', threadId);
  return { success: true };
});
