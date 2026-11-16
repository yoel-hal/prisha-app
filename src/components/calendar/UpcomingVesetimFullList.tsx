import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { onahKey } from '../../calculations/hebrewCalendar';
import { formatGregorianLocal } from '../../calculations/onah';
import type { Period, VesetResult, VesetType } from '../../calculations/types';
import { useOnahDateFormat } from '../../hooks/useOnahDateFormat';
import { useOpenCalendarDate } from '../../hooks/useOpenCalendarDate';
import { useSettingsStore } from '../../store/settingsStore';
import { vesetimFromPeriod, type PeriodVeset } from '../../utils/periodHistory';
import { textStartStyle } from '../../utils/rtl';
import { vesetBadgeColors } from '../../utils/vesetBadgeColors';
import { groupVesetimByType, VesetOnotRows } from '../veset/VesetOnotRows';

type Translate = (key: string, options?: Record<string, unknown>) => string;

/** All onot of one veset: same type and source period. */
type VesetGroup = { type: VesetType; sourcePeriodId: string; results: VesetResult[] };

/** Future vesatot, one group per veset, in date order. */
function upcomingGroups(vesetim: VesetResult[], today: string): VesetGroup[] {
  const groups = new Map<string, VesetGroup>();
  for (const veset of vesetim) {
    if (veset.dateGregorian < today) {
      continue;
    }
    const key = `${veset.type}|${veset.sourcePeriodId}`;
    const group = groups.get(key) ?? { type: veset.type, sourcePeriodId: veset.sourcePeriodId, results: [] };
    group.results.push(veset);
    groups.set(key, group);
  }
  const first = (g: VesetGroup) => Math.min(...g.results.map((r) => onahKey(r.dateHebrew, r.onah)));
  return [...groups.values()].sort((a, b) => first(a) - first(b));
}

export interface UpcomingVesetimFullListProps {
  vesetim: VesetResult[];
  periods: Period[];
}

/**
 * The קרובות screen: every future veset in date order (each with the period it comes
 * from), then all periods, newest first, each with what was calculated from it, past
 * ones marked passed or replaced, and an edit button.
 */
export function UpcomingVesetimFullList({ vesetim, periods }: UpcomingVesetimFullListProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const formatOnah = useOnahDateFormat();
  const minhag = useSettingsStore((state) => state.minhag);
  const chumrot = useSettingsStore((state) => state.chumrot);
  const today = useMemo(() => formatGregorianLocal(new Date()), []);

  const upcoming = useMemo(() => upcomingGroups(vesetim, today), [vesetim, today]);
  const periodsById = useMemo(() => new Map(periods.map((p) => [p.id, p])), [periods]);
  const periodsNewestFirst = useMemo(
    () =>
      [...periods].sort(
        (a, b) => onahKey(b.dateHebrew, b.onah) - onahKey(a.dateHebrew, a.onah),
      ),
    [periods],
  );
  // The newest period starts open (periods load after the first render).
  const newestId = periodsNewestFirst[0]?.id;
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (newestId) {
      setExpanded((prev) => (prev.size === 0 ? new Set([newestId]) : prev));
    }
  }, [newestId]);

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function sourceLabel(sourcePeriodId: string): string | undefined {
    const period = periodsById.get(sourcePeriodId);
    return period
      ? t('period.fromPeriod', { date: formatOnah(period.dateHebrew, period.onah).hebrew })
      : undefined;
  }

  const showHaflagaMissing = periods.length === 1 && chumrot.kavuah.type === 'none';

  return (
    <ScrollView style={styles.list} contentContainerStyle={styles.listContent} keyboardShouldPersistTaps="handled">
      {upcoming.length === 0 ? (
        <Text style={[styles.empty, textStartStyle()]}>{t('calendar.noUpcoming')}</Text>
      ) : (
        <View style={styles.group}>
          {upcoming.map((group) => (
            <VesetBlock
              key={`${group.type}|${group.sourcePeriodId}`}
              type={group.type}
              results={group.results}
              source={sourceLabel(group.sourcePeriodId)}
              t={t}
            />
          ))}
          {showHaflagaMissing ? <HaflagaNoDataRow t={t} /> : null}
        </View>
      )}

      {periodsNewestFirst.length > 0 ? (
        <>
          <Text style={[styles.sectionTitle, textStartStyle()]}>{t('period.myPeriods')}</Text>
          <View style={styles.section}>
            {periodsNewestFirst.map((period) => (
              <PeriodCard
                key={period.id}
                period={period}
                history={vesetimFromPeriod(periods, period.id, minhag, chumrot, vesetim, today)}
                expanded={expanded.has(period.id)}
                onToggle={() => toggle(period.id)}
                onEdit={() =>
                  router.push({ pathname: '/(app)/edit-period/[id]', params: { id: period.id } })
                }
                t={t}
              />
            ))}
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}

function PeriodCard({
  period,
  history,
  expanded,
  onToggle,
  onEdit,
  t,
}: {
  period: Period;
  history: PeriodVeset[];
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  t: Translate;
}) {
  const formatOnah = useOnahDateFormat();
  const periodText = formatOnah(period.dateHebrew, period.onah);
  const statusLabels: Record<string, string | undefined> = {};
  for (const item of history) {
    if (item.status === 'passed') {
      statusLabels[item.veset.id] = t('period.statusPassed');
    } else if (item.status === 'replaced' && item.replacedBy) {
      statusLabels[item.veset.id] = t('period.statusReplaced', {
        date: formatOnah(item.replacedBy.dateHebrew, item.replacedBy.onah).date,
      });
    }
  }

  return (
    <View style={styles.group}>
      <Pressable style={styles.collapsibleHeader} onPress={onToggle}>
        <View style={styles.collapsibleDates}>
          <Text style={[styles.periodHebrew, textStartStyle()]}>{periodText.date}</Text>
          <Text style={[styles.periodGregorian, textStartStyle()]}>{periodText.line}</Text>
        </View>
        <Text style={styles.expandIcon}>{expanded ? '▼' : '▶'}</Text>
      </Pressable>

      {expanded ? (
        <>
          <View style={styles.expandedEditRow}>
            <Pressable style={styles.editButton} onPress={onEdit}>
              <Text style={styles.editButtonText}>{t('common.edit')}</Text>
            </Pressable>
          </View>
          <View style={styles.vesetimList}>
            {history.length === 0 ? (
              <Text style={[styles.haflagaNoData, textStartStyle()]}>
                {t('period.noVesetimFromPeriod')}
              </Text>
            ) : (
              groupVesetimByType(history.map((h) => h.veset)).map(({ type, results }) => (
                <VesetBlock
                  key={type}
                  type={type}
                  results={results}
                  statusLabels={statusLabels}
                  t={t}
                />
              ))
            )}
          </View>
        </>
      ) : null}
    </View>
  );
}

/** One veset: its badge (and source) once, then all its onot. Tapping opens the calendar there. */
function VesetBlock({
  type,
  results,
  source,
  statusLabels,
  t,
}: {
  type: VesetType;
  results: VesetResult[];
  source?: string;
  statusLabels?: Record<string, string | undefined>;
  t: Translate;
}) {
  const badge = vesetBadgeColors(type);
  const openCalendar = useOpenCalendarDate();

  return (
    <Pressable
      style={styles.vesetBlock}
      onPress={() => openCalendar(results[0]!.dateGregorian)}
      accessibilityRole="button"
    >
      <View style={styles.blockHeader}>
        <View style={[styles.badge, { backgroundColor: badge.background }]}>
          <Text style={[styles.badgeText, { color: badge.text }]}>{t(`veset.${type}`)}</Text>
        </View>
        {source ? <Text style={[styles.sourceLine, textStartStyle()]}>{source}</Text> : null}
      </View>
      <VesetOnotRows results={results} statusLabels={statusLabels} />
    </Pressable>
  );
}

function HaflagaNoDataRow({ t }: { t: Translate }) {
  return (
    <View style={[styles.vesetRow, styles.vesetRowMuted]}>
      <Text style={[styles.haflagaNoData, textStartStyle()]}>
        {t('veset.haflaga')} — {t('period.haflagaNoData')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 24,
    gap: 16,
  },
  section: {
    gap: 16,
  },
  empty: {
    fontSize: 15,
    color: '#5F5459',
    lineHeight: 22,
  },
  // Each period is its own card: the period date on top, its vesatot below a divider.
  group: {
    gap: 10,
    padding: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#EAE3DD',
    backgroundColor: '#FBF8F5',
  },
  periodHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  periodDates: {
    flex: 1,
    gap: 2,
  },
  nextPeriodTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  nextPeriodSubtitle: {
    fontSize: 15,
    color: '#5F5459',
  },
  collapsibleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 4,
  },
  collapsibleDates: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  periodHebrew: {
    fontSize: 16,
    fontWeight: '600',
  },
  periodGregorian: {
    fontSize: 14,
    color: '#5F5459',
  },
  expandIcon: {
    fontSize: 14,
    color: '#5F5459',
    paddingHorizontal: 4,
  },
  expandedEditRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  editButton: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#DDD3CC',
    backgroundColor: '#F4EFEA',
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2A2226',
  },
  vesetimList: {
    gap: 6,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#EAE3DD',
  },
  /** One veset: badge on top, its onot below at full width. */
  vesetBlock: {
    gap: 8,
    paddingVertical: 8,
  },
  blockBadge: {
    alignSelf: 'flex-start',
  },
  vesetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 6,
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
  vesetGregorian: {
    fontSize: 14,
    color: '#5F5459',
  },
  vesetOnah: {
    fontSize: 14,
    color: '#5F5459',
  },
  mutedText: {
    color: '#857A7F',
  },
  haflagaNoData: {
    fontSize: 14,
    color: '#857A7F',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginTop: 8,
  },
  sourceLine: {
    fontSize: 13,
    color: '#5F5459',
  },
  blockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
});
