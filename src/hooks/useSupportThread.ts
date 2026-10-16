import { db } from '@/firebase/config';
import type { SupportMessage, SupportThread } from '@/types/supportThread';
import { log } from '@/utils/log';
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  type Timestamp,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';

function mapThread(id: string, data: Record<string, unknown>): SupportThread | null {
  const userEmail = typeof data.userEmail === 'string' ? data.userEmail : '';
  const subject = typeof data.subject === 'string' ? data.subject : '';
  const status = data.status;
  const createdAt = data.createdAt;
  const lastMessageAt = data.lastMessageAt;

  if (
    !userEmail ||
    !subject ||
    (status !== 'new' && status !== 'open' && status !== 'resolved') ||
    !createdAt ||
    typeof createdAt !== 'object' ||
    !('toDate' in createdAt) ||
    !lastMessageAt ||
    typeof lastMessageAt !== 'object' ||
    !('toDate' in lastMessageAt)
  ) {
    return null;
  }

  return {
    id,
    userId: typeof data.userId === 'string' ? data.userId : null,
    userEmail,
    subject,
    status,
    createdAt: createdAt as Timestamp,
    lastMessageAt: lastMessageAt as Timestamp,
    unreadByAdmin: data.unreadByAdmin === true,
  };
}

function mapMessage(id: string, data: Record<string, unknown>): SupportMessage | null {
  const body = typeof data.body === 'string' ? data.body : '';
  const sentBy = data.sentBy;
  const sentAt = data.sentAt;

  if (
    !body ||
    (sentBy !== 'user' && sentBy !== 'admin') ||
    !sentAt ||
    typeof sentAt !== 'object' ||
    !('toDate' in sentAt)
  ) {
    return null;
  }

  const readAt = data.readAt;
  const parsedReadAt =
    readAt &&
    typeof readAt === 'object' &&
    'toDate' in readAt
      ? (readAt as Timestamp)
      : null;

  return {
    id,
    body,
    sentBy,
    sentAt: sentAt as Timestamp,
    readAt: parsedReadAt,
  };
}

export function useSupportThread(threadId: string | undefined) {
  const [thread, setThread] = useState<SupportThread | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(Boolean(threadId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!threadId) {
      setThread(null);
      setMessages([]);
      setLoading(false);
      return;
    }

    log('[useSupportThread] enter', threadId);
    setLoading(true);

    const threadRef = doc(db, 'supportThreads', threadId);
    const messagesQuery = query(
      collection(db, 'supportThreads', threadId, 'messages'),
      orderBy('sentAt', 'asc'),
    );

    const unsubscribeThread = onSnapshot(
      threadRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setThread(null);
          setError('Thread not found');
          setLoading(false);
          return;
        }

        const mapped = mapThread(snapshot.id, snapshot.data());
        setThread(mapped);
        setError(null);
        setLoading(false);
      },
      (snapshotError) => {
        log('[useSupportThread] thread error', snapshotError);
        setError(snapshotError.message);
        setLoading(false);
      },
    );

    const unsubscribeMessages = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const mapped = snapshot.docs
          .map((docSnap) => mapMessage(docSnap.id, docSnap.data()))
          .filter((message): message is SupportMessage => message !== null);
        setMessages(mapped);
      },
      (snapshotError) => {
        log('[useSupportThread] messages error', snapshotError);
        setError(snapshotError.message);
      },
    );

    return () => {
      log('[useSupportThread] exit', threadId);
      unsubscribeThread();
      unsubscribeMessages();
    };
  }, [threadId]);

  useEffect(() => {
    if (!threadId || !thread?.unreadByAdmin) {
      return;
    }

    void updateDoc(doc(db, 'supportThreads', threadId), {
      unreadByAdmin: false,
    }).catch((markReadError) => {
      log('[useSupportThread] mark read error', markReadError);
    });
  }, [thread?.unreadByAdmin, threadId]);

  return { thread, messages, loading, error };
}
