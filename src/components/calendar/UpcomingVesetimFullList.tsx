import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { formatGregorianLocal } from '../../calculations/onah';
import type { Period, VesetResult, VesetType } from '../../calculations/types';
import type { SupportedLanguage } from '../../i18n';
import { formatGregorianDisplay } from '../../utils/formatGregorianDisplay';
import { formatHebrewDate } from '../../utils/hebrewDateFormat';
import { textStartStyle } from '../../utils/rtl';
import { vesetBadgeColors } from '../../utils/vesetBadgeColors';

const VESET_TYPES: VesetType[] = ['onahBeinonit', 'haflaga', 'yomHaChodesh'];

type GroupedPeriod = {
  period: Period;
  vesetim: VesetResult[];
};

function vesetTranslationKey(type: VesetType): string {
  return `veset.${type}`;
}

function buildGroupedPeriods(
  vesetim: VesetResult[],
  periods: Period[],
  today: string,
): {
  nextGroup: GroupedPeriod | null;
  otherUpcomingGroups: GroupedPeriod[];
  pastGroups: GroupedPeriod[];
} {
  const periodMap = new Map(periods.map((p) => [p.id, p]));

  const byPeriodId = new Map<string, VesetResult[]>();
  for (const veset of vesetim) {
    const list = byPeriodId.get(veset.sourcePeriodId) ?? [];
    list.push(veset);
    byPeriodId.set(veset.sourcePeriodId, list);
  }

  const groups: GroupedPeriod[] = [];
  for (const [sourcePeriodId, periodVesetim] of byPeriodId) {
    const period = periodMap.get(sourcePeriodId);
    if (!period) continue;

    const sortedVesetim = [...periodVesetim].sort((a, b) =>
      a.dateGregorian.localeCompare(b.dateGregorian),
    );

    groups.push({ period, vesetim: sortedVesetim });
  }

  groups.sort((a, b) =>
    b.period.dateGregorian.localeCompare(a.period.dateGregorian),
  );

  const upcomingGroups = groups
    .filter((g) => g.vesetim.some((v) => v.dateGregorian >= today))
    .sort((a, b) =>
      a.period.dateGregorian.localeCompare(b.period.dateGregorian),
    );

  const pastGroups = groups
    .filter((g) => g.vesetim.every((v) => v.dateGregorian < today))
    .sort((a, b) =>
      b.period.dateGregorian.localeCompare(a.period.dateGregorian),
    );

  return {
    nextGroup: upcomingGroups[0] ?? null,
    otherUpcomingGroups: upcomingGroups.slice(1),
    pastGroups,
  };
}

export interface UpcomingVesetimFullListProps {
  vesetim: VesetResult[];
  periods: Period[];
}

export function UpcomingVesetimFullList({
  vesetim,
  periods,
}: UpcomingVesetimFullListProps) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const language = i18n.language as SupportedLanguage;
  const [expandedPeriodIds, setExpandedPeriodIds] = useState<Set<string>>(
    new Set(),
  );
  const [pastExpanded, setPastExpanded] = useState(false);

  const today = useMemo(() => formatGregorianLocal(new Date()), []);
  const { nextGroup, otherUpcomingGroups, pastGroups } = useMemo(
    () => buildGroupedPeriods(vesetim, periods, today),
    [vesetim, periods, today],
  );

  const upcomingGroupsCount =
    (nextGroup ? 1 : 0) + otherUpcomingGroups.length;

  console.log('[UpcomingVesetimFullList] render', {
    totalVesetim: vesetim.length,
    totalPeriods: periods.length,
    upcomingGroups: upcomingGroupsCount,
    pastGroups: pastGroups.length,
  });

  function togglePeriod(id: string) {
    setExpandedPeriodIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function navigateToEdit(periodId: string) {
    router.push({
      pathname: '/(app)/edit-period/[id]',
      params: { id: periodId },
    });
  }

  return (
    <ScrollView
      style={styles.list}
      contentContainerStyle={styles.listContent}
      keyboardShouldPersistTaps="handled"
    >
      {nextGroup ? (
        <NextUpcomingGroup
          group={nextGroup}
          today={today}
          language={language}
          periodsCount={periods.length}
          onEdit={() => navigateToEdit(nextGroup.period.id)}
          t={t}
        />
      ) : (
        <Text style={[styles.empty, textStartStyle()]}>
          {t('calendar.noUpcoming')}
        </Text>
      )}

      {otherUpcomingGroups.length > 0 ? (
        <View style={styles.section}>
          {otherUpcomingGroups.map((group) => (
            <CollapsiblePeriodGroup
              key={group.period.id}
              group={group}
              expanded={expandedPeriodIds.has(group.period.id)}
              today={today}
              language={language}
              periodsCount={periods.length}
              onToggle={() => togglePeriod(group.period.id)}
              onEdit={() => navigateToEdit(group.period.id)}
              t={t}
            />
          ))}
        </View>
      ) : null}

      {pastGroups.length > 0 ? (
        <View style={styles.pastSection}>
          <Pressable
            style={styles.pastToggle}
            onPress={() => setPastExpanded((v) => !v)}
          >
            <Text style={[styles.pastToggleText, textStartStyle()]}>
              {pastExpanded
                ? `▲ ${t('period.hidePastPeriods')}`
                : `▼ ${t('period.showPastPeriods')}`}
            </Text>
          </Pressable>

          {pastExpanded ? (
            <View style={styles.section}>
              {pastGroups.map((group) => (
                <CollapsiblePeriodGroup
                  key={group.period.id}
                  group={group}
                  expanded={expandedPeriodIds.has(group.period.id)}
                  today={today}
                  language={language}
                  periodsCount={periods.length}
                  onToggle={() => togglePeriod(group.period.id)}
                  onEdit={() => navigateToEdit(group.period.id)}
                  t={t}
                />
              ))}
            </View>
          ) : null}
        </View>
      ) : null}
    </ScrollView>
  );
}

interface NextUpcomingGroupProps {
  group: GroupedPeriod;
  today: string;
  language: SupportedLanguage;
  periodsCount: number;
  onEdit: () => void;
  t: (key: string) => string;
}

function NextUpcomingGroup({
  group,
  today,
  language,
  periodsCount,
  onEdit,
  t,
}: NextUpcomingGroupProps) {
  const { period } = group;

  return (
    <View style={styles.group}>
      <View style={styles.periodHeader}>
        <View style={styles.periodDates}>
          <Text style={[styles.nextPeriodTitle, textStartStyle()]}>
            {formatHebrewDate(period.dateHebrew, language)}
          </Text>
          <Text style={[styles.nextPeriodSubtitle, textStartStyle()]}>
            {formatGregorianDisplay(period.dateGregorian, language)}
          </Text>
        </View>
        <Pressable style={styles.editButton} onPress={onEdit}>
          <Text style={styles.editButtonText}>{t('common.edit')}</Text>
        </Pressable>
      </View>

      <VesetimRows
        group={group}
        today={today}
        language={language}
        periodsCount={periodsCount}
        t={t}
      />
    </View>
  );
}

interface CollapsiblePeriodGroupProps {
  group: GroupedPeriod;
  expanded: boolean;
  today: string;
  language: SupportedLanguage;
  periodsCount: number;
  onToggle: () => void;
  onEdit: () => void;
  t: (key: string) => string;
}

function CollapsiblePeriodGroup({
  group,
  expanded,
  today,
  language,
  periodsCount,
  onToggle,
  onEdit,
  t,
}: CollapsiblePeriodGroupProps) {
  const { period } = group;

  return (
    <View style={styles.group}>
      <Pressable style={styles.collapsibleHeader} onPress={onToggle}>
        <View style={styles.collapsibleDates}>
          <Text style={[styles.periodHebrew, textStartStyle()]}>
            {formatHebrewDate(period.dateHebrew, language)}
          </Text>
          <Text style={[styles.periodGregorian, textStartStyle()]}>
            {formatGregorianDisplay(period.dateGregorian, language)}
          </Text>
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
          <VesetimRows
            group={group}
            today={today}
            language={language}
            periodsCount={periodsCount}
            t={t}
          />
        </>
      ) : null}
    </View>
  );
}

interface VesetimRowsProps {
  group: GroupedPeriod;
  today: string;
  language: SupportedLanguage;
  periodsCount: number;
  t: (key: string) => string;
}

function VesetimRows({
  group,
  today,
  language,
  periodsCount,
  t,
}: VesetimRowsProps) {
  const { period } = group;

  return (
    <View style={styles.vesetimList}>
      {VESET_TYPES.map((type) => {
        const typeVesetim = group.vesetim
          .filter((v) => v.type === type)
          .sort((a, b) => a.dateGregorian.localeCompare(b.dateGregorian));

        if (typeVesetim.length > 0) {
          return typeVesetim.map((veset) => (
            <VesetRow
              key={veset.id}
              veset={veset}
              language={language}
              muted={veset.dateGregorian < today}
              t={t}
            />
          ));
        }

        if (type === 'haflaga' && periodsCount < 2) {
          return (
            <HaflagaNoDataRow key={`${period.id}-haflaga-missing`} t={t} />
          );
        }

        return null;
      })}
    </View>
  );
}

interface VesetRowProps {
  veset: VesetResult;
  language: SupportedLanguage;
  muted: boolean;
  t: (key: string) => string;
}

function VesetRow({ veset, language, muted, t }: VesetRowProps) {
  const badge = vesetBadgeColors(veset.type);

  return (
    <View style={[styles.vesetRow, muted && styles.vesetRowMuted]}>
      <View style={[styles.badge, { backgroundColor: badge.background }]}>
        <Text style={[styles.badgeText, { color: badge.text }]}>
          {t(vesetTranslationKey(veset.type))}
        </Text>
      </View>
      <Text
        style={[
          styles.vesetDate,
          muted && styles.mutedText,
          textStartStyle(),
        ]}
      >
        {formatHebrewDate(veset.dateHebrew, language)}
      </Text>
      <Text
        style={[
          styles.vesetGregorian,
          muted && styles.mutedText,
          textStartStyle(),
        ]}
      >
        {formatGregorianDisplay(veset.dateGregorian, language)}
      </Text>
      <Text
        style={[
          styles.vesetOnah,
          muted && styles.mutedText,
          textStartStyle(),
        ]}
      >
        {t(veset.onah === 'day' ? 'period.day' : 'period.night')}
      </Text>
    </View>
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
    color: '#666',
    lineHeight: 22,
  },
  group: {
    gap: 8,
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
    fontWeight: '700',
  },
  nextPeriodSubtitle: {
    fontSize: 15,
    color: '#555',
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
    color: '#555',
  },
  expandIcon: {
    fontSize: 14,
    color: '#666',
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
    borderColor: '#ccc',
    backgroundColor: '#f5f5f5',
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  vesetimList: {
    gap: 6,
    paddingStart: 4,
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
    color: '#444',
  },
  vesetOnah: {
    fontSize: 14,
    color: '#666',
  },
  mutedText: {
    color: '#888',
  },
  haflagaNoData: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
  },
  pastSection: {
    marginTop: 8,
    gap: 16,
  },
  pastToggle: {
    paddingVertical: 10,
  },
  pastToggleText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#444',
  },
});
