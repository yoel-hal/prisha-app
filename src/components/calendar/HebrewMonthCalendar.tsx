import { HDate } from '@hebcal/hdate';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { MarkedDates } from 'react-native-calendars/src/types';

import { formatGregorianLocal } from '../../calculations/onah';
import type { HebrewDate } from '../../calculations/types';
import { hebrewDayLetters, hebrewMonthName, hebrewYearLetters } from '../../utils/hebrewDateFormat';
import { isAppRTL } from '../../utils/rtl';
import { Icon } from '../common/Icon';

export type HebrewMonth = { year: number; month: number };

export type HebrewCalendarDay = {
  date: Date;
  dateGregorian: string;
  hebrew: HebrewDate;
};

interface HebrewMonthCalendarProps {
  month: HebrewMonth;
  onMonthChange: (month: HebrewMonth) => void;
  onDayPress: (day: HebrewCalendarDay) => void;
  /** Dots per Gregorian date (yyyy-mm-dd), as built by buildMarkedDates. */
  markedDates?: MarkedDates;
  /** Highlighted Gregorian date (yyyy-mm-dd), e.g. the picked period date. */
  selectedDate?: string;
  compact?: boolean;
}

const WEEKDAYS_HE = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
const WEEKDAYS_EN = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const SHABBAT = 6;

/** The Hebrew month containing `date`. */
export function hebrewMonthOf(date: Date): HebrewMonth {
  const hd = new HDate(date);
  return { year: hd.getFullYear(), month: hd.getMonth() };
}

// Step through days, not HDate.add('M'), which lands on the wrong month across Tishrei.
function shiftMonth({ year, month }: HebrewMonth, delta: 1 | -1): HebrewMonth {
  const first = new HDate(1, month, year);
  const target =
    delta === 1 ? new HDate(first.abs() + first.daysInMonth()) : new HDate(first.abs() - 1);
  return { year: target.getFullYear(), month: target.getMonth() };
}

function gregorianSpan(first: Date, last: Date, locale: string): string {
  const monthFmt = new Intl.DateTimeFormat(locale, { month: 'long' });
  const sameYear = first.getFullYear() === last.getFullYear();
  if (sameYear) {
    return `${monthFmt.format(first)}–${monthFmt.format(last)} ${last.getFullYear()}`;
  }
  return `${monthFmt.format(first)} ${first.getFullYear()}–${monthFmt.format(last)} ${last.getFullYear()}`;
}

/**
 * Month grid paged by Hebrew month. Each day shows both dates: in Hebrew the Hebrew
 * day (in letters) is large and the Gregorian day small; in English the reverse.
 * Weeks start on Sunday; rows mirror automatically in RTL.
 */
export function HebrewMonthCalendar({
  month,
  onMonthChange,
  onDayPress,
  markedDates,
  selectedDate,
  compact = false,
}: HebrewMonthCalendarProps) {
  const { t, i18n } = useTranslation();
  const isHebrew = i18n.language === 'he';
  const rtl = isAppRTL();
  const todayKey = formatGregorianLocal(new Date());

  const { title, subtitle, weeks } = useMemo(() => {
    const first = new HDate(1, month.month, month.year);
    const daysInMonth = first.daysInMonth();
    const last = new HDate(first.abs() + daysInMonth - 1);

    const days: (HebrewCalendarDay | null)[] = Array.from({ length: first.getDay() }, () => null);
    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new HDate(day, month.month, month.year).greg();
      days.push({
        date,
        dateGregorian: formatGregorianLocal(date),
        hebrew: { year: month.year, month: month.month, day },
      });
    }
    while (days.length % 7 !== 0) {
      days.push(null);
    }
    const rows: (HebrewCalendarDay | null)[][] = [];
    for (let index = 0; index < days.length; index += 7) {
      rows.push(days.slice(index, index + 7));
    }

    return {
      title: isHebrew
        ? `${hebrewMonthName(month.month, month.year)} ${hebrewYearLetters(month.year)}`
        : `${first.getMonthName()} ${month.year}`,
      subtitle: gregorianSpan(first.greg(), last.greg(), isHebrew ? 'he-IL' : 'en-US'),
      weeks: rows,
    };
  }, [month.month, month.year, isHebrew]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          style={styles.navButton}
          onPress={() => onMonthChange(shiftMonth(month, -1))}
          accessibilityRole="button"
          accessibilityLabel={t('calendar.previousMonth')}
        >
          <Icon name={rtl ? 'chevron-right' : 'chevron-left'} size={22} color="#1a1a1a" />
        </Pressable>
        <View style={styles.titleWrap}>
          <Text style={[styles.title, compact && styles.titleCompact]}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        <Pressable
          style={styles.navButton}
          onPress={() => onMonthChange(shiftMonth(month, 1))}
          accessibilityRole="button"
          accessibilityLabel={t('calendar.nextMonth')}
        >
          <Icon name={rtl ? 'chevron-left' : 'chevron-right'} size={22} color="#1a1a1a" />
        </Pressable>
      </View>

      <View style={styles.row}>
        {(isHebrew ? WEEKDAYS_HE : WEEKDAYS_EN).map((label) => (
          <Text key={label} style={styles.weekday}>
            {label}
          </Text>
        ))}
      </View>

      {weeks.map((week, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {week.map((day, colIndex) => {
            if (!day) {
              return <View key={colIndex} style={[styles.cell, compact && styles.cellCompact]} />;
            }
            const isShabbat = colIndex === SHABBAT;
            const isToday = day.dateGregorian === todayKey;
            const isSelected = day.dateGregorian === selectedDate;
            const dots = markedDates?.[day.dateGregorian]?.dots ?? [];
            const hebrewLabel = hebrewDayLetters(day.hebrew.day);
            const gregorianLabel = String(day.date.getDate());

            return (
              <Pressable
                key={colIndex}
                onPress={() => onDayPress(day)}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`${hebrewLabel} ${gregorianLabel}`}
                style={[
                  styles.cell,
                  compact && styles.cellCompact,
                  isShabbat && styles.cellShabbat,
                  isToday && styles.cellToday,
                  isSelected && styles.cellSelected,
                ]}
              >
                <Text
                  style={[
                    styles.primary,
                    isShabbat && styles.textShabbat,
                    isSelected && styles.textSelected,
                  ]}
                >
                  {isHebrew ? hebrewLabel : gregorianLabel}
                </Text>
                <Text style={[styles.secondary, isSelected && styles.textSelectedMuted]}>
                  {isHebrew ? gregorianLabel : hebrewLabel}
                </Text>
                <View style={styles.dots}>
                  {dots.slice(0, 4).map((dot) => (
                    <View key={dot.key} style={[styles.dot, { backgroundColor: dot.color }]} />
                  ))}
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  titleCompact: {
    fontSize: 16,
  },
  subtitle: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: 4,
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    color: '#999',
    paddingVertical: 4,
  },
  cell: {
    flex: 1,
    minHeight: 56,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  cellCompact: {
    minHeight: 48,
  },
  cellShabbat: {
    backgroundColor: '#FDF1E3',
  },
  cellToday: {
    borderWidth: 1.5,
    borderColor: '#1a1a1a',
  },
  cellSelected: {
    backgroundColor: '#1a1a1a',
  },
  primary: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  secondary: {
    fontSize: 10,
    color: '#888',
    marginTop: 1,
  },
  textShabbat: {
    color: '#B45309',
  },
  textSelected: {
    color: '#fff',
  },
  textSelectedMuted: {
    color: '#ddd',
  },
  dots: {
    flexDirection: 'row',
    gap: 2,
    height: 5,
    marginTop: 2,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
});
