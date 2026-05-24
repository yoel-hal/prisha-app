import { Calendar } from 'react-native-calendars';
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
import { PendingInviteGlobalBanner } from '../../src/components/couple/PendingInviteGlobalBanner';
import { CalendarDaySheet } from '../../src/components/calendar/CalendarDaySheet';
import { UpcomingVesetimList } from '../../src/components/calendar/UpcomingVesetimList';
import { WebMainContent } from '../../src/components/web/WebMainContent';
import { useCalendar } from '../../src/hooks/useCalendar';
import { useDesktopWeb } from '../../src/hooks/useDesktopWeb';
import { usePeriods } from '../../src/hooks/usePeriods';
import { useVesetCalculations } from '../../src/hooks/useVesetCalculations';
import { isAppRTL, textStartStyle } from '../../src/utils/rtl';

export default function CalendarScreen() {
  const { t } = useTranslation();
  const isDesktopWeb = useDesktopWeb();
  usePeriods();
  const { vesetim } = useVesetCalculations();
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

  const calendarBody = (
    <>
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
        <PendingInviteGlobalBanner />
        <View
          style={[
            styles.desktopRow,
            isAppRTL() ? styles.desktopRowRtl : styles.desktopRowLtr,
          ]}
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
  calendarDesktop: {
    paddingStart: 0,
    paddingEnd: 0,
    minHeight: 420,
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
    gap: 24,
    minHeight: 500,
  },
  desktopRowLtr: {
    flexDirection: 'row',
  },
  desktopRowRtl: {
    flexDirection: 'row-reverse',
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
