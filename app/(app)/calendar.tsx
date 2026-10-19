import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CalendarDayPanel } from '../../src/components/calendar/CalendarDayPanel';
import { CalendarDaySheet } from '../../src/components/calendar/CalendarDaySheet';
import { CalendarView } from '../../src/components/calendar/CalendarView';
import { UpcomingVesetimList } from '../../src/components/calendar/UpcomingVesetimList';
import { WebMainContent } from '../../src/components/web/WebMainContent';
import { useCalendar } from '../../src/hooks/useCalendar';
import { useDesktopWeb } from '../../src/hooks/useDesktopWeb';
import { usePeriods } from '../../src/hooks/usePeriods';
import { useVesetCalculations } from '../../src/hooks/useVesetCalculations';
import { parseGregorianLocal } from '../../src/calculations/onah';
import { textStartStyle } from '../../src/utils/rtl';

export default function CalendarScreen() {
  const { t } = useTranslation();
  const isDesktopWeb = useDesktopWeb();
  // Any date in the Hebrew month on screen; the calendar pages by Hebrew month.
  const [displayMonth, setDisplayMonth] = useState<Date>(() => new Date());
  usePeriods();
  const { vesetim } = useVesetCalculations();
  const {
    isLoading,
    markedDates,
    selectedEvents,
    onMonthChange,
    onDayPress,
    selectDate,
    selectedDate,
    closeSheet,
    hasData,
  } = useCalendar();

  // Opened from the upcoming list with ?date=YYYY-MM-DD: show that month and day.
  const { date } = useLocalSearchParams<{ date?: string }>();
  const router = useRouter();
  useEffect(() => {
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return;
    }
    setDisplayMonth(parseGregorianLocal(date));
    selectDate(date);
    router.setParams({ date: undefined });
  }, [date, router, selectDate]);

  const calendarBody = (
    <>
      <View
        style={[
          styles.header,
          { alignItems: 'flex-start' },
        ]}
      >
        <Text style={[styles.title, textStartStyle()]}>{t('calendar.title')}</Text>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      ) : (
        <>
          <CalendarView
            displayMonth={displayMonth}
            onDisplayMonthChange={setDisplayMonth}
            markedDates={markedDates}
            onDayPress={onDayPress}
            onMonthChange={onMonthChange}
            isDesktopWeb={isDesktopWeb}
            selectedDate={selectedDate}
          />
          {!hasData ? (
            <Text style={styles.empty}>{t('calendar.noData')}</Text>
          ) : null}
        </>
      )}
    </>
  );

  if (isDesktopWeb) {
    return (
      <WebMainContent scrollable={false}>
        <View
          style={styles.desktopRow}
        >
          <View style={styles.desktopCalendarCol}>{calendarBody}</View>
          <View style={styles.desktopSideCol}>
            {selectedEvents.length > 0 ? (
              <>
                <View style={styles.sideHeader}>
                  <Text style={[styles.sideTitle, textStartStyle()]}>
                    {t('calendar.dayDetails')}
                  </Text>
                  <Pressable onPress={closeSheet}>
                    <Text style={styles.clearLink}>{t('calendar.clearSelection')}</Text>
                  </Pressable>
                </View>
                <CalendarDayPanel events={selectedEvents} vesetim={vesetim} />
              </>
            ) : (
              <UpcomingVesetimList vesetim={vesetim} />
            )}
          </View>
        </View>
      </WebMainContent>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {calendarBody}
      <CalendarDaySheet
        visible={selectedEvents.length > 0}
        selectedEvent={selectedEvents[0] ?? null}
        events={selectedEvents}
        vesetim={vesetim}
        onClose={closeSheet}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#666',
  },
  empty: {
    textAlign: 'center',
    color: '#666',
    padding: 20,
  },
  desktopRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 24,
    minHeight: 500,
  },
  desktopCalendarCol: {
    flex: 1.2,
    minWidth: 0,
  },
  desktopSideCol: {
    flex: 0.8,
    minWidth: 280,
    maxWidth: 360,
  },
  sideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },
  sideTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  clearLink: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '500',
  },
});
