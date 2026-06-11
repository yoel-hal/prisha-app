import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import type { VesetResult, VesetType } from '../../calculations/types';
import type { SupportedLanguage } from '../../i18n';
import { formatGregorianDisplay } from '../../utils/formatGregorianDisplay';
import { formatHebrewDate } from '../../utils/hebrewDateFormat';
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
  const { t, i18n } = useTranslation();
  const language = i18n.language as SupportedLanguage;
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
      ) : (
        results.map((veset) => (
          <View key={veset.id} style={styles.resultBlock}>
            <Text style={[styles.hebrewDate, textStartStyle()]}>
              {formatHebrewDate(veset.dateHebrew, language)}
            </Text>
            <Text style={[styles.gregorianDate, textStartStyle()]}>
              {formatGregorianDisplay(veset.dateGregorian, language)}
            </Text>
            <Text style={[styles.onah, textStartStyle()]}>
              {t(veset.onah === 'day' ? 'period.day' : 'period.night')}
            </Text>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e5e5',
    padding: 16,
    gap: 12,
    backgroundColor: '#fafafa',
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
    color: '#555',
  },
  onah: {
    fontSize: 14,
    color: '#666',
  },
  empty: {
    fontSize: 15,
    color: '#888',
    fontStyle: 'italic',
  },
});
