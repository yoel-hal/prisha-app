import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import type { VesetResult, VesetType } from '../../calculations/types';
import { VesetOnotRows } from '../veset/VesetOnotRows';
import { textStartStyle } from '../../utils/rtl';
import { vesetBadgeColors } from '../../utils/vesetBadgeColors';

function vesetTranslationKey(type: VesetType): string {
  return `veset.${type}`;
}

export interface PeriodPreviewVesetCardProps {
  type: VesetType;
  results: VesetResult[] | null;
  notEnoughDataLabel?: string;
}

export function PeriodPreviewVesetCard({
  type,
  results,
  notEnoughDataLabel,
}: PeriodPreviewVesetCardProps) {
  const { t } = useTranslation();
  const badge = vesetBadgeColors(type);

  return (
    <View style={styles.card}>
      <View style={[styles.badge, { backgroundColor: badge.background }]}>
        <Text style={[styles.badgeText, { color: badge.text }]}>
          {t(vesetTranslationKey(type))}
        </Text>
      </View>

      {results === null ? (
        <Text style={[styles.empty, textStartStyle()]}>
          {notEnoughDataLabel}
        </Text>
      ) : results.length === 0 ? (
        <Text style={[styles.empty, textStartStyle()]}>{t('period.vesetNone')}</Text>
      ) : (
        <VesetOnotRows results={results} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#EAE3DD',
    padding: 16,
    gap: 12,
    backgroundColor: '#FFFFFF',
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  resultBlock: {
    gap: 4,
  },
  hebrewDate: {
    fontSize: 16,
    fontWeight: '600',
  },
  gregorianDate: {
    fontSize: 14,
    color: '#5F5459',
  },
  empty: {
    fontSize: 15,
    color: '#857A7F',
  },
});
