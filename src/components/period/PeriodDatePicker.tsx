import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { formatGregorianLocal } from '../../calculations/onah';
import type { HebrewDate } from '../../calculations/types';
import type { SupportedLanguage } from '../../i18n';
import { formatGregorianDisplay } from '../../utils/formatGregorianDisplay';
import { formatHebrewDateWithYear } from '../../utils/hebrewDateFormat';
import { textStartStyle } from '../../utils/rtl';
import {
  HebrewMonthCalendar,
  hebrewMonthOf,
  type HebrewMonth,
} from '../calendar/HebrewMonthCalendar';

interface PeriodDatePickerProps {
  gregorianDate: Date;
  hebrewDate: HebrewDate;
  onGregorianChange: (date: Date) => void;
}

/**
 * One calendar for picking the period date, the same on web and phone. Each day shows
 * both dates, and the chosen date is spelled out above in both calendars.
 */
export function PeriodDatePicker({
  gregorianDate,
  hebrewDate,
  onGregorianChange,
}: PeriodDatePickerProps) {
  const { t, i18n } = useTranslation();
  const language = i18n.language as SupportedLanguage;
  const selectedKey = formatGregorianLocal(gregorianDate);
  const [month, setMonth] = useState<HebrewMonth>(() => hebrewMonthOf(gregorianDate));

  // Follow date changes from outside (e.g. an edited period loading) to their month.
  useEffect(() => {
    setMonth(hebrewMonthOf(new Date(`${selectedKey}T12:00:00`)));
  }, [selectedKey]);

  const hebrewText = formatHebrewDateWithYear(hebrewDate);
  const gregorianText = formatGregorianDisplay(selectedKey, language);

  return (
    <View style={styles.section}>
      <Text style={[styles.label, textStartStyle()]}>{t('period.date')}</Text>

      <View style={styles.summary}>
        <Text style={[styles.summaryPrimary, textStartStyle()]}>
          {language === 'he' ? hebrewText : gregorianText}
        </Text>
        <Text style={[styles.summarySecondary, textStartStyle()]}>
          {language === 'he' ? gregorianText : hebrewText}
        </Text>
      </View>

      <View style={styles.calendarCard}>
        <HebrewMonthCalendar
          month={month}
          onMonthChange={setMonth}
          onDayPress={(day) => onGregorianChange(day.date)}
          selectedDate={selectedKey}
          compact
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 10,
  },
  label: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
  },
  summary: {
    gap: 2,
  },
  summaryPrimary: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  summarySecondary: {
    fontSize: 14,
    color: '#666',
  },
  calendarCard: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e5e5',
    padding: 10,
    backgroundColor: '#fff',
  },
});
