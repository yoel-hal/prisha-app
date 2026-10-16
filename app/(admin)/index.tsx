import { StatCard } from '@/components/admin/StatCard';
import { StatsChart } from '@/components/admin/StatsChart';
import type { Minhag } from '@/calculations/types';
import { db } from '@/firebase/config';
import { log } from '@/utils/log';
import { textStartStyle } from '@/utils/rtl';
import { doc, onSnapshot, type Timestamp } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Platform = 'ios' | 'android' | 'web';

export interface AdminStats {
  updatedAt: Timestamp;
  totalUsers: number;
  newUsersThisWeek: number;
  activeUsersLast30Days: number;
  byCountry: Record<string, number>;
  byMinhag: Record<Minhag, number>;
  coupleAdoptionRate: number;
  byPlatform: Record<Platform, number>;
}

function formatUpdatedAt(timestamp: Timestamp, locale: string): string {
  return timestamp.toDate().toLocaleString(locale === 'he' ? 'he-IL' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function mapAdminStats(data: Record<string, unknown>): AdminStats | null {
  const updatedAt = data.updatedAt;
  if (
    !updatedAt ||
    typeof updatedAt !== 'object' ||
    !('toDate' in updatedAt) ||
    typeof (updatedAt as Timestamp).toDate !== 'function'
  ) {
    return null;
  }

  const byMinhagRaw =
    data.byMinhag && typeof data.byMinhag === 'object'
      ? (data.byMinhag as Record<string, number>)
      : {};

  const byPlatformRaw =
    data.byPlatform && typeof data.byPlatform === 'object'
      ? (data.byPlatform as Record<string, number>)
      : {};

  return {
    updatedAt: updatedAt as Timestamp,
    totalUsers: typeof data.totalUsers === 'number' ? data.totalUsers : 0,
    newUsersThisWeek:
      typeof data.newUsersThisWeek === 'number' ? data.newUsersThisWeek : 0,
    activeUsersLast30Days:
      typeof data.activeUsersLast30Days === 'number'
        ? data.activeUsersLast30Days
        : 0,
    byCountry:
      data.byCountry && typeof data.byCountry === 'object'
        ? (data.byCountry as Record<string, number>)
        : {},
    byMinhag: {
      ashkenaz: byMinhagRaw.ashkenaz ?? 0,
      sfarad: byMinhagRaw.sfarad ?? 0,
      chabad: byMinhagRaw.chabad ?? 0,
      teimani: byMinhagRaw.teimani ?? 0,
    },
    coupleAdoptionRate:
      typeof data.coupleAdoptionRate === 'number' ? data.coupleAdoptionRate : 0,
    byPlatform: {
      ios: byPlatformRaw.ios ?? 0,
      android: byPlatformRaw.android ?? 0,
      web: byPlatformRaw.web ?? 0,
    },
  };
}

export default function AdminStatsScreen() {
  const { t, i18n } = useTranslation();
  const { width } = useWindowDimensions();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isWide = width >= 768;

  useEffect(() => {
    log('[AdminStatsScreen] enter');

    const statsRef = doc(db, 'admin', 'stats');
    const unsubscribe = onSnapshot(
      statsRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setStats(null);
          setLoading(false);
          return;
        }

        const mapped = mapAdminStats(snapshot.data());
        setStats(mapped);
        setError(null);
        setLoading(false);
      },
      (snapshotError) => {
        log('[AdminStatsScreen] snapshot error', snapshotError);
        setError(snapshotError.message);
        setLoading(false);
      },
    );

    return () => {
      log('[AdminStatsScreen] exit');
      unsubscribe();
    };
  }, []);

  const minhagChartData = useMemo(() => {
    if (!stats) {
      return {};
    }

    return Object.fromEntries(
      (Object.entries(stats.byMinhag) as [Minhag, number][])
        .filter(([, count]) => count > 0)
        .map(([key, count]) => [t(`minhag.${key}`), count]),
    );
  }, [stats, t]);

  return (
    <SafeAreaView className="flex-1 bg-neutral-50" edges={['top', 'bottom']}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-6 p-4 pb-10"
      >
        <View className="gap-1">
          <Text
            className="text-2xl font-bold text-neutral-900"
            style={textStartStyle()}
          >
            {t('admin.stats.title')}
          </Text>
          {stats ? (
            <Text className="text-sm text-neutral-500" style={textStartStyle()}>
              {t('admin.stats.lastUpdated')}:{' '}
              {formatUpdatedAt(stats.updatedAt, i18n.language)}
            </Text>
          ) : null}
        </View>

        {loading ? (
          <View className="items-center py-12">
            <ActivityIndicator size="large" color="#171717" />
            <Text className="mt-3 text-sm text-neutral-500">
              {t('common.loading')}
            </Text>
          </View>
        ) : null}

        {error ? (
          <Text
            className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-800"
            style={textStartStyle()}
          >
            {error}
          </Text>
        ) : null}

        {!loading && !error && stats ? (
          <>
            <View className="flex-row flex-wrap gap-3">
              <StatCard
                label={t('admin.stats.totalUsers')}
                value={stats.totalUsers}
              />
              <StatCard
                label={t('admin.stats.newThisWeek')}
                value={stats.newUsersThisWeek}
                color="#2563eb"
              />
              <StatCard
                label={t('admin.stats.activeLast30')}
                value={stats.activeUsersLast30Days}
                color="#16a34a"
              />
              <StatCard
                label={t('admin.stats.coupleAdoption')}
                value={`${stats.coupleAdoptionRate}%`}
                color="#7c3aed"
              />
            </View>

            <View
              className={`gap-4 ${isWide ? 'flex-row' : 'flex-col'}`}
            >
              <View className="flex-1 rounded-xl border border-neutral-200 bg-white p-4">
                <StatsChart
                  type="pie"
                  data={minhagChartData}
                  title={t('admin.stats.byMinhag')}
                />
              </View>
              <View className="flex-1 rounded-xl border border-neutral-200 bg-white p-4">
                <StatsChart
                  type="bar"
                  data={stats.byCountry}
                  title={t('admin.stats.byCountry')}
                />
              </View>
            </View>

            <View className="gap-3">
              <Text
                className="text-base font-semibold text-neutral-900"
                style={textStartStyle()}
              >
                {t('admin.stats.byPlatform')}
              </Text>
              <View className="flex-row flex-wrap gap-3">
                <StatCard
                  label={t('admin.stats.ios')}
                  value={stats.byPlatform.ios}
                  color="#111827"
                />
                <StatCard
                  label={t('admin.stats.android')}
                  value={stats.byPlatform.android}
                  color="#16a34a"
                />
                <StatCard
                  label={t('admin.stats.web')}
                  value={stats.byPlatform.web}
                  color="#2563eb"
                />
              </View>
            </View>
          </>
        ) : null}

        {!loading && !error && !stats ? (
          <Text className="text-sm text-neutral-500" style={textStartStyle()}>
            {t('common.comingSoon')}
          </Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
