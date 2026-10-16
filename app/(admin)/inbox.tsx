import { ReplyBox } from '@/components/admin/ReplyBox';
import { ThreadList } from '@/components/admin/ThreadList';
import { ThreadView } from '@/components/admin/ThreadView';
import { useSupportThread } from '@/hooks/useSupportThread';
import { useAdminStore } from '@/store/adminStore';
import type { SupportThreadStatus } from '@/types/supportThread';
import { log } from '@/utils/log';
import { textStartStyle } from '@/utils/rtl';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type StatusFilter = SupportThreadStatus | 'all';

const FILTER_OPTIONS: StatusFilter[] = ['all', 'new', 'open', 'resolved'];

function InboxHeader({
  statusFilter,
  onFilterChange,
}: {
  statusFilter: StatusFilter;
  onFilterChange: (filter: StatusFilter) => void;
}) {
  const { t } = useTranslation();
  const unreadCount = useAdminStore((state) => state.unreadCount);

  return (
    <View className="gap-3 border-b border-neutral-200 bg-white px-4 py-4">
      <View className="flex-row items-center gap-2">
        <Text
          className="text-2xl font-bold text-neutral-900"
          style={textStartStyle()}
        >
          {t('admin.inbox.title')}
        </Text>
        {unreadCount > 0 ? (
          <View className="rounded-full bg-blue-600 px-2.5 py-0.5">
            <Text className="text-xs font-semibold text-white">
              {unreadCount} {t('admin.inbox.unread')}
            </Text>
          </View>
        ) : null}
      </View>

      <View className="flex-row flex-wrap gap-2">
        {FILTER_OPTIONS.map((filter) => {
          const isActive = statusFilter === filter;
          const label =
            filter === 'all'
              ? t('admin.inbox.filterAll')
              : t(`admin.inbox.status.${filter}`);

          return (
            <Pressable
              key={filter}
              onPress={() => onFilterChange(filter)}
              className={`rounded-full px-3 py-1.5 ${
                isActive ? 'bg-neutral-900' : 'bg-neutral-100'
              }`}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
            >
              <Text
                className={`text-sm font-medium ${
                  isActive ? 'text-white' : 'text-neutral-700'
                }`}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function ThreadDetailPanel({ threadId }: { threadId: string }) {
  const { t } = useTranslation();
  const { thread, messages, loading, error } = useSupportThread(threadId);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#171717" />
        <Text className="mt-3 text-sm text-neutral-500">{t('common.loading')}</Text>
      </View>
    );
  }

  if (error || !thread) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-sm text-red-800" style={textStartStyle()}>
          {error ?? t('common.comingSoon')}
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <View className="border-b border-neutral-200 bg-white px-4 py-3">
        <Text className="text-base font-semibold text-neutral-900" style={textStartStyle()}>
          {thread.subject}
        </Text>
        <Text className="text-sm text-neutral-500" style={textStartStyle()}>
          {thread.userEmail}
        </Text>
      </View>
      <ThreadView messages={messages} userEmail={thread.userEmail} />
      <ReplyBox threadId={thread.id} status={thread.status} />
    </View>
  );
}

export default function AdminInboxScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= 768 && Platform.OS === 'web';
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedThreadId, setSelectedThreadId] = useState<string | undefined>();

  useEffect(() => {
    log('[AdminInboxScreen] enter');
    return () => {
      log('[AdminInboxScreen] exit');
    };
  }, []);

  const handleSelectThread = (threadId: string) => {
    if (isWide) {
      setSelectedThreadId(threadId);
      return;
    }
    router.push(`/inbox/${threadId}`);
  };

  return (
    <SafeAreaView className="flex-1 bg-neutral-50" edges={['top', 'bottom']}>
      <View className={`flex-1 ${isWide ? 'flex-row' : 'flex-col'}`}>
        <View className={`${isWide ? 'w-[360px] border-e border-neutral-200' : 'flex-1'}`}>
          <InboxHeader
            statusFilter={statusFilter}
            onFilterChange={setStatusFilter}
          />
          <ThreadList
            selectedThreadId={selectedThreadId}
            statusFilter={statusFilter}
            onSelectThread={handleSelectThread}
          />
        </View>

        {isWide ? (
          <View className="flex-1 bg-white">
            {selectedThreadId ? (
              <ThreadDetailPanel threadId={selectedThreadId} />
            ) : (
              <View className="flex-1 items-center justify-center px-6">
                <Text className="text-sm text-neutral-500" style={textStartStyle()}>
                  {t('admin.inbox.selectThread')}
                </Text>
              </View>
            )}
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
