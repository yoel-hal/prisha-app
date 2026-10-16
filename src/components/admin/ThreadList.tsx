import { db } from '@/firebase/config';
import { useAdminStore } from '@/store/adminStore';
import type {
  SupportThread,
  SupportThreadStatus,
} from '@/types/supportThread';
import { log } from '@/utils/log';
import { textStartStyle } from '@/utils/rtl';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  type Timestamp,
} from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

type ThreadListProps = {
  selectedThreadId?: string;
  statusFilter: SupportThreadStatus | 'all';
  onSelectThread: (threadId: string) => void;
};

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

function formatRelativeTime(timestamp: Timestamp, locale: string): string {
  return timestamp.toDate().toLocaleString(locale === 'he' ? 'he-IL' : 'en-US', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

const STATUS_COLORS: Record<SupportThreadStatus, string> = {
  new: 'bg-blue-100 text-blue-800',
  open: 'bg-amber-100 text-amber-800',
  resolved: 'bg-neutral-200 text-neutral-700',
};

export function ThreadList({
  selectedThreadId,
  statusFilter,
  onSelectThread,
}: ThreadListProps) {
  const { t, i18n } = useTranslation();
  const setUnreadCount = useAdminStore((state) => state.setUnreadCount);
  const [threads, setThreads] = useState<SupportThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    log('[ThreadList] enter');

    const threadsQuery = query(
      collection(db, 'supportThreads'),
      orderBy('lastMessageAt', 'desc'),
    );

    const unsubscribe = onSnapshot(
      threadsQuery,
      (snapshot) => {
        const mapped = snapshot.docs
          .map((docSnap) => mapThread(docSnap.id, docSnap.data()))
          .filter((thread): thread is SupportThread => thread !== null);
        setThreads(mapped);
        setError(null);
        setLoading(false);
      },
      (snapshotError) => {
        log('[ThreadList] snapshot error', snapshotError);
        setError(snapshotError.message);
        setLoading(false);
      },
    );

    return () => {
      log('[ThreadList] exit');
      unsubscribe();
    };
  }, []);

  const filteredThreads = useMemo(() => {
    if (statusFilter === 'all') {
      return threads;
    }
    return threads.filter((thread) => thread.status === statusFilter);
  }, [statusFilter, threads]);

  useEffect(() => {
    const unread = threads.filter((thread) => thread.unreadByAdmin).length;
    setUnreadCount(unread);
  }, [setUnreadCount, threads]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center py-12">
        <ActivityIndicator size="small" color="#171717" />
      </View>
    );
  }

  if (error) {
    return (
      <Text
        className="m-4 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-800"
        style={textStartStyle()}
      >
        {error}
      </Text>
    );
  }

  if (filteredThreads.length === 0) {
    return (
      <View className="flex-1 items-center justify-center px-6 py-12">
        <Text className="text-center text-sm text-neutral-500" style={textStartStyle()}>
          {t('admin.inbox.noThreads')}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1" contentContainerClassName="pb-4">
      {filteredThreads.map((thread) => {
        const isSelected = thread.id === selectedThreadId;
        const isUnread = thread.unreadByAdmin;

        return (
          <Pressable
            key={thread.id}
            onPress={() => onSelectThread(thread.id)}
            className={`border-b border-neutral-200 px-4 py-3 ${
              isSelected ? 'bg-neutral-100' : 'bg-white'
            } ${isUnread ? 'border-s-4 border-s-blue-600' : 'border-s-4 border-s-transparent'}`}
            accessibilityRole="button"
          >
            <View className="gap-1">
              <View className="flex-row items-center justify-between gap-2">
                <Text
                  className={`flex-1 text-sm text-neutral-900 ${
                    isUnread ? 'font-bold' : 'font-medium'
                  }`}
                  style={textStartStyle()}
                  numberOfLines={1}
                >
                  {thread.userEmail}
                </Text>
                <View
                  className={`rounded-full px-2 py-0.5 ${STATUS_COLORS[thread.status]}`}
                >
                  <Text className="text-xs font-medium">
                    {t(`admin.inbox.status.${thread.status}`)}
                  </Text>
                </View>
              </View>
              <Text
                className={`text-sm text-neutral-700 ${isUnread ? 'font-semibold' : ''}`}
                style={textStartStyle()}
                numberOfLines={1}
              >
                {thread.subject}
              </Text>
              <Text className="text-xs text-neutral-500" style={textStartStyle()}>
                {formatRelativeTime(thread.lastMessageAt, i18n.language)}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
