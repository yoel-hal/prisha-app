import { HDate } from '@hebcal/hdate';
import type { DateData } from 'react-native-calendars';
import type { MarkedDates } from 'react-native-calendars/src/types';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { formatGregorianLocal } from '../../calculations/onah';
import { MARKER_COLORS, type CalendarMarkerKind } from '../../utils/calendarMarkers';
import { HebrewMonthCalendar, hebrewMonthOf, type HebrewMonth } from './HebrewMonthCalendar';

export interface CalendarViewProps {
  /** Any date inside the Hebrew month to show. */
  displayMonth: Date;
  onDisplayMonthChange: (date: Date) => void;
  markedDates: MarkedDates;
  onDayPress: (day: DateData) => void;
  onMonthChange: (month: DateData) => void;
  isDesktopWeb?: boolean;
  /** YYYY-MM-DD of the day whose details are shown. */
  selectedDate?: string | null;
}

const LEGEND: { kind: CalendarMarkerKind; labelKey: string }[] = [
  { kind: 'period', labelKey: 'period.sectionPeriodDay' },
  { kind: 'onahBeinonit', labelKey: 'veset.onahBeinonit' },
  { kind: 'haflaga', labelKey: 'veset.haflaga' },
  { kind: 'yomHaChodesh', labelKey: 'veset.yomHaChodesh' },
];

function toDateData(date: Date): DateData {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    dateString: formatGregorianLocal(date),
    timestamp: date.getTime(),
  };
}

export function CalendarView({
  displayMonth,
  onDisplayMonthChange,
  markedDates,
  onDayPress,
  onMonthChange,
  selectedDate,
}: CalendarViewProps) {
  const { t } = useTranslation();

  const handleMonthChange = (next: HebrewMonth) => {
    const firstDay = new HDate(1, next.month, next.year).greg();
    onDisplayMonthChange(firstDay);
    onMonthChange(toDateData(firstDay));
  };

  return (
    <View style={styles.container}>
      <HebrewMonthCalendar
        month={hebrewMonthOf(displayMonth)}
        onMonthChange={handleMonthChange}
        onDayPress={(day) => onDayPress(toDateData(day.date))}
        markedDates={markedDates}
        selectedDate={selectedDate ?? undefined}
      />
      <View style={styles.legend}>
        {LEGEND.map((item) => (
          <View key={item.kind} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: MARKER_COLORS[item.kind] }]} />
            <Text style={styles.legendText}>{t(item.labelKey)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    gap: 12,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
});
