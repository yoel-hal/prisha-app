import { HDate } from '@hebcal/hdate';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { DateData } from 'react-native-calendars';

import { formatGregorianLocal } from '../calculations/onah';
import type { SupportedLanguage } from '../i18n';
import {
  buildMarkedDates,
  getEventsForDate,
  type CalendarDayEvent,
} from '../utils/calendarMarkers';
import { formatHebrewMonthYear } from '../utils/hebrewDateFormat';
import { usePeriods } from './usePeriods';
import { useVesetCalculations } from './useVesetCalculations';

function monthKeyFromDateString(date: string): string {
  return date.slice(0, 7);
}

export function useCalendar() {
  const { i18n } = useTranslation();
  const language = i18n.language as SupportedLanguage;
  const { periods, isLoading } = usePeriods();
  const { vesetim } = useVesetCalculations();

  const today = formatGregorianLocal(new Date());
  const [visibleMonth, setVisibleMonth] = useState(monthKeyFromDateString(today));
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

  const headerHebrewMonth = useMemo(() => {
    const [year, month] = visibleMonth.split('-').map(Number);
    const anchor = new Date(year, month - 1, 15);
    const hdate = new HDate(anchor);
    return formatHebrewMonthYear(
      {
        year: hdate.getFullYear(),
        month: hdate.getMonth(),
        day: hdate.getDate(),
      },
      language,
    );
  }, [visibleMonth, language]);

  const headerGregorianMonth = useMemo(() => {
    const [year, month] = visibleMonth.split('-').map(Number);
    const formatter = new Intl.DateTimeFormat(
      language === 'he' ? 'he-IL' : 'en-US',
      { month: 'long', year: 'numeric' },
    );
    return formatter.format(new Date(year, month - 1, 1));
  }, [visibleMonth, language]);

  const onMonthChange = useCallback((month: DateData) => {
    const key = `${month.year}-${String(month.month).padStart(2, '0')}`;
    setVisibleMonth(key);
  }, []);

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
    headerHebrewMonth,
    headerGregorianMonth,
    onMonthChange,
    onDayPress,
    closeSheet,
    hasData: periods.length > 0 || vesetim.length > 0,
  };
}
