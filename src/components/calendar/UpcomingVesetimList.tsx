import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { formatGregorianLocal } from '../../calculations/onah';
import type { VesetResult, VesetType } from '../../calculations/types';
import type { SupportedLanguage } from '../../i18n';
import { useOpenCalendarDate } from '../../hooks/useOpenCalendarDate';
import { formatHebrewDate } from '../../utils/hebrewDateFormat';
import { textStartStyle } from '../../utils/rtl';
import { vesetBadgeColors } from '../../utils/vesetBadgeColors';
import { groupVesetimByType, VesetOnotRows } from '../veset/VesetOnotRows';

function vesetTranslationKey(type: VesetType): string {
  return `veset.${type}`;
}

function findNextPeriodGroup(
  vesetim: VesetResult[],
  today: string,
): { sourcePeriodId: string | null; group: VesetResult[] } {
  const futureVesetim = vesetim.filter((v) => v.dateGregorian >= today);
  if (futureVesetim.length === 0) {
    return { sourcePeriodId: null, group: [] };
  }

  const earliestDate = futureVesetim.reduce(
    (min, v) => (v.dateGregorian < min ? v.dateGregorian : min),
    futureVesetim[0].dateGregorian,
  );

  const earliestVeset = futureVesetim.find(
    (v) => v.dateGregorian === earliestDate,
  );
  if (!earliestVeset) {
    return { sourcePeriodId: null, group: [] };
  }

  const group = vesetim
    .filter((v) => v.sourcePeriodId === earliestVeset.sourcePeriodId)
    .sort((a, b) => a.dateGregorian.localeCompare(b.dateGregorian));

  return { sourcePeriodId: earliestVeset.sourcePeriodId, group };
}

export interface UpcomingVesetimListProps {
  vesetim: VesetResult[];
}

/** One veset: its badge once, then all its onot. Tapping opens that day in the calendar. */
function VesetBlock({ type, results, t }: { type: VesetType; results: VesetResult[]; t: (key: string) => string }) {
  const badge = vesetBadgeColors(type);
  const openCalendar = useOpenCalendarDate();

  return (
    <Pressable
      style={styles.vesetBlock}
      onPress={() => openCalendar(results[0]!.dateGregorian)}
      accessibilityRole="button"
    >
      <View style={[styles.badge, styles.blockBadge, { backgroundColor: badge.background }]}>
        <Text style={[styles.badgeText, { color: badge.text }]}>
          {t(vesetTranslationKey(type))}
        </Text>
      </View>
      <VesetOnotRows results={results} compact />
    </Pressable>
  );
}

function HaflagaNoDataRow({ t }: { t: (key: string) => string }) {
  return (
    <View style={[styles.vesetRow, styles.vesetRowMuted]}>
      <Text style={[styles.haflagaNoData, textStartStyle()]}>
        {t('veset.haflaga')} — {t('period.haflagaNoData')}
      </Text>
    </View>
  );
}

export function UpcomingVesetimList({ vesetim }: UpcomingVesetimListProps) {
  const { t, i18n } = useTranslation();
  const language = i18n.language as SupportedLanguage;
  const today = useMemo(() => formatGregorianLocal(new Date()), []);

  const { sourcePeriodId: nextSourcePeriodId, group: nextGroup } = useMemo(
    () => findNextPeriodGroup(vesetim, today),
    [vesetim, today],
  );

  console.log('[UpcomingVesetimList] render', {
    total: vesetim.length,
    nextSourcePeriodId,
    nextGroupCount: nextGroup.length,
  });

  const hasHaflaga = nextGroup.some((v) => v.type === 'haflaga');

  return (
    <View style={styles.container}>
      <Text style={[styles.heading, textStartStyle()]}>
        {t('calendar.upcomingVesetim')}
      </Text>

      {nextGroup.length === 0 ? (
        <Text style={[styles.empty, textStartStyle()]}>
          {t('calendar.noUpcoming')}
        </Text>
      ) : (
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          <Text style={[styles.periodTitle, textStartStyle()]}>
            {formatHebrewDate(nextGroup[0].dateHebrew, language)}
          </Text>

          {groupVesetimByType(nextGroup).map(({ type, results }) => (
            <VesetBlock key={type} type={type} results={results} t={t} />
          ))}

          {!hasHaflaga ? <HaflagaNoDataRow t={t} /> : null}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e5e5',
    padding: 20,
    minHeight: 320,
  },
  heading: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  empty: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  list: {
    flex: 1,
  },
  listContent: {
    gap: 8,
    paddingBottom: 8,
  },
  periodTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  /** One veset: badge on top, its onot below at full width. */
  vesetBlock: {
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  blockBadge: {
    alignSelf: 'flex-start',
  },
  vesetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  vesetRowMuted: {
    opacity: 0.55,
  },
  badge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  vesetDate: {
    fontSize: 14,
    fontWeight: '500',
  },
  vesetOnah: {
    fontSize: 14,
    color: '#666',
  },
  haflagaNoData: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
  },
});
