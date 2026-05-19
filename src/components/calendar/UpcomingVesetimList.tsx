import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import type { VesetResult, VesetType } from '../../calculations/types';
import type { SupportedLanguage } from '../../i18n';
import { getUpcomingVesetim } from '../../utils/upcomingVesetim';
import { formatHebrewDate } from '../../utils/hebrewDateFormat';
import { textStartStyle } from '../../utils/rtl';

function vesetTranslationKey(type: VesetType): string {
  return `veset.${type}`;
}

export interface UpcomingVesetimListProps {
  vesetim: VesetResult[];
}

export function UpcomingVesetimList({ vesetim }: UpcomingVesetimListProps) {
  const { t, i18n } = useTranslation();
  const language = i18n.language as SupportedLanguage;

  const upcoming = useMemo(() => getUpcomingVesetim(vesetim, 3), [vesetim]);

  return (
    <View style={styles.container}>
      <Text style={[styles.heading, textStartStyle()]}>
        {t('calendar.upcomingVesetim')}
      </Text>

      {upcoming.length === 0 ? (
        <Text style={[styles.empty, textStartStyle()]}>
          {t('calendar.noUpcoming')}
        </Text>
      ) : (
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {upcoming.map((veset) => (
            <View key={veset.id} style={styles.row}>
              <Text style={[styles.type, textStartStyle()]}>
                {t(vesetTranslationKey(veset.type))}
              </Text>
              <Text style={[styles.date, textStartStyle()]}>
                {formatHebrewDate(veset.dateHebrew, language)}
              </Text>
              <Text style={[styles.onah, textStartStyle()]}>
                {t(veset.onah === 'day' ? 'period.day' : 'period.night')}
              </Text>
            </View>
          ))}
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
    gap: 12,
    paddingBottom: 8,
  },
  row: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
    gap: 4,
  },
  type: {
    fontSize: 16,
    fontWeight: '600',
  },
  date: {
    fontSize: 15,
    color: '#444',
  },
  onah: {
    fontSize: 14,
    color: '#666',
  },
});
