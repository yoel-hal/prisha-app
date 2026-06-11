import { Calendar } from 'react-native-calendars';
import type { DateData } from 'react-native-calendars';
import type { MarkedDates } from 'react-native-calendars/src/types';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

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
  const { t } = useTranslation();
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
          style={[styles.navRow, rtl ? styles.navRowRtl : styles.navRowLtr]}
        >
          <Pressable
            onPress={() => goToMonth(addMonths(displayMonth, -1))}
            style={styles.navButton}
            accessibilityRole="button"
            accessibilityLabel={t('calendar.previousMonth')}
          >
            <Icon name={prevIcon} size={24} color="#1a1a1a" />
          </Pressable>
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
        key={isWeb ? monthAnchorKey(displayMonth) : undefined}
        current={monthAnchorKey(displayMonth)}
        markingType="multi-dot"
        markedDates={markedDates}
        onDayPress={onDayPress}
        onMonthChange={handleMonthChange}
        enableSwipeMonths={!isWeb}
        hideArrows={isWeb}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  navRowLtr: {
    flexDirection: 'row',
  },
  navRowRtl: {
    flexDirection: 'row-reverse',
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
