import { Calendar } from 'react-native-calendars';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CalendarDaySheet } from '../../src/components/calendar/CalendarDaySheet';
import { useCalendar } from '../../src/hooks/useCalendar';
import { isAppRTL, textStartStyle } from '../../src/utils/rtl';

export default function CalendarScreen() {
  const { t } = useTranslation();
  const {
    isLoading,
    markedDates,
    selectedEvents,
    headerHebrewMonth,
    headerGregorianMonth,
    onMonthChange,
    onDayPress,
    closeSheet,
    hasData,
  } = useCalendar();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View
        style={[
          styles.header,
          { alignItems: isAppRTL() ? 'flex-end' : 'flex-start' },
        ]}
      >
        <Text style={[styles.title, textStartStyle()]}>{t('calendar.title')}</Text>
        <Text style={[styles.hebrewMonth, textStartStyle()]}>{headerHebrewMonth}</Text>
        <Text style={[styles.gregorianMonth, textStartStyle()]}>
          {headerGregorianMonth}
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      ) : (
        <>
          <Calendar
            markingType="multi-dot"
            markedDates={markedDates}
            onDayPress={onDayPress}
            onMonthChange={onMonthChange}
            enableSwipeMonths
            style={styles.calendar}
            theme={{
              todayTextColor: '#1a1a1a',
              selectedDayBackgroundColor: '#1a1a1a',
              arrowColor: '#1a1a1a',
            }}
          />
          {!hasData ? (
            <Text style={styles.empty}>{t('calendar.noData')}</Text>
          ) : null}
        </>
      )}

      <CalendarDaySheet
        visible={selectedEvents.length > 0}
        selectedEvent={selectedEvents[0] ?? null}
        events={selectedEvents}
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
  hebrewMonth: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 4,
  },
  gregorianMonth: {
    fontSize: 15,
    color: '#666',
  },
  calendar: {
    paddingStart: 8,
    paddingEnd: 8,
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
});
