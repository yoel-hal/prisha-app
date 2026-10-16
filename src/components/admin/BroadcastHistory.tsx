import { db } from '@/firebase/config';
import type {
  Broadcast,
  BroadcastChannels,
  BroadcastStatus,
  BroadcastTargetFilter,
} from '@/types/broadcast';
import { log } from '@/utils/log';
import { textStartStyle } from '@/utils/rtl';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  type Timestamp,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
} from 'react-native';

const STATUS_COLORS: Record<BroadcastStatus, string> = {
  draft: 'bg-neutral-200 text-neutral-700',
  scheduled: 'bg-amber-100 text-amber-800',
  sent: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
};

function mapBroadcast(
  id: string,
  data: Record<string, unknown>,
): Broadcast | null {
  const createdAt = data.createdAt;
  if (
    !createdAt ||
    typeof createdAt !== 'object' ||
    !('toDate' in createdAt)
  ) {
    return null;
  }

  const status = data.status;
  if (
    status !== 'draft' &&
    status !== 'scheduled' &&
    status !== 'sent' &&
    status !== 'failed'
  ) {
    return null;
  }

  const channelsRaw =
    data.channels && typeof data.channels === 'object'
      ? (data.channels as Record<string, unknown>)
      : {};

  const targetRaw =
    data.targetFilter && typeof data.targetFilter === 'object'
      ? (data.targetFilter as Record<string, unknown>)
      : {};

  const targetType = targetRaw.type;
  const targetFilter: BroadcastTargetFilter =
    targetType === 'byMinhag' || targetType === 'byCountry' || targetType === 'all'
      ? {
          type: targetType,
          value:
            typeof targetRaw.value === 'string' ? targetRaw.value : undefined,
        }
      : { type: 'all' };

  const channels: BroadcastChannels = {
    push: channelsRaw.push === true,
    inApp: channelsRaw.inApp === true,
    email: channelsRaw.email === true,
  };

  const scheduledAt =
    data.scheduledAt &&
    typeof data.scheduledAt === 'object' &&
    'toDate' in data.scheduledAt
      ? (data.scheduledAt as Timestamp)
      : null;

  const sentAt =
    data.sentAt &&
    typeof data.sentAt === 'object' &&
    'toDate' in data.sentAt
      ? (data.sentAt as Timestamp)
      : null;

  return {
    id,
    titleHe: typeof data.titleHe === 'string' ? data.titleHe : '',
    titleEn: typeof data.titleEn === 'string' ? data.titleEn : '',
    bodyHe: typeof data.bodyHe === 'string' ? data.bodyHe : '',
    bodyEn: typeof data.bodyEn === 'string' ? data.bodyEn : '',
    channels,
    targetFilter,
    scheduledAt,
    sentAt,
    status,
    recipientCount:
      typeof data.recipientCount === 'number' ? data.recipientCount : 0,
    createdAt: createdAt as Timestamp,
  };
}

function formatTimestamp(timestamp: Timestamp, locale: string): string {
  return timestamp.toDate().toLocaleString(locale === 'he' ? 'he-IL' : 'en-US', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

function formatChannels(
  channels: BroadcastChannels,
  t: (key: string) => string,
): string {
  const labels: string[] = [];
  if (channels.push) labels.push(t('admin.broadcast.channels.push'));
  if (channels.inApp) labels.push(t('admin.broadcast.channels.inApp'));
  if (channels.email) labels.push(t('admin.broadcast.channels.email'));
  return labels.join(', ') || '—';
}

function formatTarget(
  targetFilter: BroadcastTargetFilter,
  t: (key: string) => string,
): string {
  if (targetFilter.type === 'all') {
    return t('admin.broadcast.target.all');
  }
  if (targetFilter.type === 'byMinhag') {
    const minhag = targetFilter.value ?? '';
    return `${t('admin.broadcast.target.byMinhag')}: ${minhag ? t(`minhag.${minhag}`) : '—'}`;
  }
  return `${t('admin.broadcast.target.byCountry')}: ${targetFilter.value ?? '—'}`;
}

export function BroadcastHistory() {
  const { t, i18n } = useTranslation();
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    log('[BroadcastHistory] enter');

    const broadcastsQuery = query(
      collection(db, 'broadcasts'),
      orderBy('createdAt', 'desc'),
    );

    const unsubscribe = onSnapshot(
      broadcastsQuery,
      (snapshot) => {
        const mapped = snapshot.docs
          .map((docSnap) => mapBroadcast(docSnap.id, docSnap.data()))
          .filter((item): item is Broadcast => item !== null);
        setBroadcasts(mapped);
        setError(null);
        setLoading(false);
      },
      (snapshotError) => {
        log('[BroadcastHistory] snapshot error', snapshotError);
        setError(snapshotError.message);
        setLoading(false);
      },
    );

    return () => {
      log('[BroadcastHistory] exit');
      unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <View className="items-center py-8">
        <ActivityIndicator size="small" color="#171717" />
      </View>
    );
  }

  if (error) {
    return (
      <Text
        className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-800"
        style={textStartStyle()}
      >
        {error}
      </Text>
    );
  }

  if (broadcasts.length === 0) {
    return (
      <Text className="py-6 text-center text-sm text-neutral-500" style={textStartStyle()}>
        —
      </Text>
    );
  }

  return (
    <View className="gap-2">
      {broadcasts.map((broadcast) => {
        const isExpanded = expandedId === broadcast.id;

        return (
          <Pressable
            key={broadcast.id}
            onPress={() =>
              setExpandedId(isExpanded ? null : broadcast.id)
            }
            className="rounded-xl border border-neutral-200 bg-white"
            accessibilityRole="button"
            accessibilityState={{ expanded: isExpanded }}
          >
            <View className="gap-2 p-4">
              <View className="flex-row items-start justify-between gap-2">
                <View className="flex-1 gap-1">
                  <Text
                    className="text-sm font-semibold text-neutral-900"
                    style={textStartStyle()}
                    numberOfLines={1}
                  >
                    {broadcast.titleHe}
                  </Text>
                  <Text className="text-xs text-neutral-500" style={textStartStyle()}>
                    {formatTimestamp(broadcast.createdAt, i18n.language)}
                  </Text>
                </View>
                <View
                  className={`rounded-full px-2.5 py-1 ${STATUS_COLORS[broadcast.status]}`}
                >
                  <Text className="text-xs font-medium">
                    {t(`admin.broadcast.status.${broadcast.status}`)}
                  </Text>
                </View>
              </View>

              <View className="flex-row flex-wrap gap-x-4 gap-y-1">
                <Text className="text-xs text-neutral-600" style={textStartStyle()}>
                  {formatChannels(broadcast.channels, t)}
                </Text>
                <Text className="text-xs text-neutral-600" style={textStartStyle()}>
                  {formatTarget(broadcast.targetFilter, t)}
                </Text>
                <Text className="text-xs text-neutral-600" style={textStartStyle()}>
                  {broadcast.recipientCount} {t('admin.broadcast.recipients')}
                </Text>
              </View>

              {isExpanded ? (
                <View className="mt-2 gap-3 border-t border-neutral-100 pt-3">
                  <View className="gap-1">
                    <Text
                      className="text-xs font-semibold text-neutral-500"
                      style={textStartStyle()}
                    >
                      {t('admin.broadcast.hebrew')}
                    </Text>
                    <Text
                      className="text-sm font-medium text-neutral-900"
                      style={textStartStyle()}
                    >
                      {broadcast.titleHe}
                    </Text>
                    <Text className="text-sm text-neutral-700" style={textStartStyle()}>
                      {broadcast.bodyHe}
                    </Text>
                  </View>
                  <View className="gap-1">
                    <Text
                      className="text-xs font-semibold text-neutral-500"
                      style={textStartStyle()}
                    >
                      {t('admin.broadcast.english')}
                    </Text>
                    <Text
                      className="text-sm font-medium text-neutral-900"
                      style={textStartStyle()}
                    >
                      {broadcast.titleEn}
                    </Text>
                    <Text className="text-sm text-neutral-700" style={textStartStyle()}>
                      {broadcast.bodyEn}
                    </Text>
                  </View>
                  {broadcast.scheduledAt ? (
                    <Text className="text-xs text-neutral-600" style={textStartStyle()}>
                      {t('admin.broadcast.schedule.later')}:{' '}
                      {formatTimestamp(broadcast.scheduledAt, i18n.language)}
                    </Text>
                  ) : null}
                  {broadcast.sentAt ? (
                    <Text className="text-xs text-neutral-600" style={textStartStyle()}>
                      {t('admin.broadcast.status.sent')}:{' '}
                      {formatTimestamp(broadcast.sentAt, i18n.language)}
                    </Text>
                  ) : null}
                </View>
              ) : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
