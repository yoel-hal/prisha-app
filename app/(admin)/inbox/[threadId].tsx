import { ReplyBox } from '@/components/admin/ReplyBox';
import { ThreadList } from '@/components/admin/ThreadList';
import { ThreadView } from '@/components/admin/ThreadView';
import { useSupportThread } from '@/hooks/useSupportThread';
import type { SupportThreadStatus } from '@/types/supportThread';
import { log } from '@/utils/log';
import { textStartStyle } from '@/utils/rtl';
import { useLocalSearchParams, useRouter } from 'expo-router';
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

function MobileThreadDetail({ threadId }: { threadId: string }) {
  const { t } = useTranslation();
  const router = useRouter();
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
      <View className="flex-row items-center gap-2 border-b border-neutral-200 bg-white px-4 py-3">
        <Pressable
          onPress={() => router.back()}
          className="rounded-lg px-2 py-1"
          accessibilityRole="button"
        >
          <Text className="text-base text-blue-600">←</Text>
        </Pressable>
        <View className="flex-1">
          <Text
            className="text-base font-semibold text-neutral-900"
            style={textStartStyle()}
            numberOfLines={1}
          >
            {thread.subject}
          </Text>
          <Text className="text-sm text-neutral-500" style={textStartStyle()} numberOfLines={1}>
            {thread.userEmail}
          </Text>
        </View>
      </View>
      <ThreadView messages={messages} userEmail={thread.userEmail} />
      <ReplyBox threadId={thread.id} status={thread.status} />
    </View>
  );
}

export default function AdminInboxThreadScreen() {
  const { threadId } = useLocalSearchParams<{ threadId: string }>();
  const { width } = useWindowDimensions();
  const isWide = width >= 768 && Platform.OS === 'web';
  const [statusFilter] = useState<StatusFilter>('all');
  const router = useRouter();

  useEffect(() => {
    log('[AdminInboxThreadScreen] enter', threadId);
    return () => {
      log('[AdminInboxThreadScreen] exit', threadId);
    };
  }, [threadId]);

  if (!threadId || typeof threadId !== 'string') {
    return null;
  }

  if (isWide) {
    return (
      <SafeAreaView className="flex-1 bg-neutral-50" edges={['top', 'bottom']}>
        <View className="flex-1 flex-row">
          <View className="w-[360px] border-e border-neutral-200">
            <ThreadList
              selectedThreadId={threadId}
              statusFilter={statusFilter}
              onSelectThread={(id) => router.replace(`/inbox/${id}`)}
            />
          </View>
          <View className="flex-1 bg-white">
            <MobileThreadDetail threadId={threadId} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <MobileThreadDetail threadId={threadId} />
    </SafeAreaView>
  );
}
