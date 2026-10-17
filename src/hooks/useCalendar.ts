import { useCallback, useMemo, useState } from 'react';
import type { DateData } from 'react-native-calendars';

import {
  buildMarkedDates,
  getEventsForDate,
  type CalendarDayEvent,
} from '../utils/calendarMarkers';
import { usePeriods } from './usePeriods';
import { useVesetCalculations } from './useVesetCalculations';

export function useCalendar() {
  const { periods, isLoading } = usePeriods();
  const { vesetim } = useVesetCalculations();

  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const markedDates = useMemo(
    () => buildMarkedDates(periods, vesetim),
    [periods, vesetim],
  );

  const selectedEvents: CalendarDayEvent[] = useMemo(() => {
    if (!selectedDate) {
      return [];
    }
    return getEventsForDate(selectedDate, periods, vesetim);
  }, [selectedDate, periods, vesetim]);

  // The calendar keeps its own visible month; nothing here depends on it.
  const onMonthChange = useCallback((_month: DateData) => undefined, []);

  const onDayPress = useCallback(
    (day: DateData) => {
      const hasMarkers = markedDates[day.dateString]?.dots?.length;
      if (hasMarkers) {
        setSelectedDate(day.dateString);
      }
    },
    [markedDates],
  );

  const closeSheet = useCallback(() => {
    setSelectedDate(null);
  }, []);

  return {
    isLoading,
    markedDates,
    selectedDate,
    selectedEvents,
    onMonthChange,
    onDayPress,
    closeSheet,
    hasData: periods.length > 0 || vesetim.length > 0,
  };
}
