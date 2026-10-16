import { Calendar } from 'react-native-calendars';
import type { DateData } from 'react-native-calendars';
import type { MarkedDates } from 'react-native-calendars/src/types';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { formatGregorianLocal } from '../../calculations/onah';
import { isAppRTL } from '../../utils/rtl';
import { Icon } from '../common/Icon';

export interface CalendarViewProps {
  displayMonth: Date;
  onDisplayMonthChange: (date: Date) => void;
  markedDates: MarkedDates;
  onDayPress: (day: DateData) => void;
  onMonthChange: (month: DateData) => void;
  isDesktopWeb?: boolean;
}

function addMonths(date: Date, monthDelta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + monthDelta, 1);
}

function monthAnchorKey(date: Date): string {
  return formatGregorianLocal(new Date(date.getFullYear(), date.getMonth(), 1));
}

function dateDataFromMonth(date: Date): DateData {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const anchor = new Date(year, date.getMonth(), 1);
  return {
    year,
    month,
    day: 1,
    dateString: formatGregorianLocal(anchor),
    timestamp: anchor.getTime(),
  };
}

export function CalendarView({
  displayMonth,
  onDisplayMonthChange,
  markedDates,
  onDayPress,
  onMonthChange,
  isDesktopWeb = false,
}: CalendarViewProps) {
  const { t, i18n } = useTranslation();
  const isWeb = Platform.OS === 'web';
  const rtl = isAppRTL();

  const prevIcon = rtl ? 'chevron-right' : 'chevron-left';
  const nextIcon = rtl ? 'chevron-left' : 'chevron-right';

  const goToMonth = (date: Date) => {
    onDisplayMonthChange(date);
    onMonthChange(dateDataFromMonth(date));
  };

  const handleMonthChange = (month: DateData) => {
    onMonthChange(month);
    onDisplayMonthChange(new Date(month.year, month.month - 1, 1));
  };

  return (
    <View>
      {isWeb ? (
        <View
          style={styles.navRow}
        >
          <Pressable
            onPress={() => goToMonth(addMonths(displayMonth, -1))}
            style={styles.navButton}
            accessibilityRole="button"
            accessibilityLabel={t('calendar.previousMonth')}
          >
            <Icon name={prevIcon} size={24} color="#1a1a1a" />
          </Pressable>
          <Text style={[styles.navTitle, isDesktopWeb && styles.navTitleDesktop]}>
            {displayMonth.toLocaleDateString(i18n.language, { month: 'long', year: 'numeric' })}
          </Text>
          <Pressable
            onPress={() => goToMonth(addMonths(displayMonth, 1))}
            style={styles.navButton}
            accessibilityRole="button"
            accessibilityLabel={t('calendar.nextMonth')}
          >
            <Icon name={nextIcon} size={24} color="#1a1a1a" />
          </Pressable>
        </View>
      ) : null}

      <Calendar
        // Remount on language change so month and day names pick up the new locale.
        key={isWeb ? `${i18n.language}-${monthAnchorKey(displayMonth)}` : i18n.language}
        current={monthAnchorKey(displayMonth)}
        markingType="multi-dot"
        markedDates={markedDates}
        onDayPress={onDayPress}
        onMonthChange={handleMonthChange}
        enableSwipeMonths={!isWeb}
        hideArrows={isWeb}
        // Web shows the month between its own arrows (above), so skip the built-in title.
        renderHeader={isWeb ? () => null : undefined}
        style={isDesktopWeb ? styles.calendarDesktop : styles.calendar}
        theme={{
          todayTextColor: '#1a1a1a',
          selectedDayBackgroundColor: '#1a1a1a',
          arrowColor: '#1a1a1a',
          textDayFontSize: isDesktopWeb ? 16 : 14,
          textMonthFontSize: isDesktopWeb ? 18 : 16,
          textDayHeaderFontSize: isDesktopWeb ? 14 : 12,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 4,
  },
  navTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  navTitleDesktop: {
    fontSize: 18,
  },
  navButton: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendar: {
    paddingStart: 8,
    paddingEnd: 8,
  },
  calendarDesktop: {
    paddingStart: 0,
    paddingEnd: 0,
    minHeight: 420,
  },
});
