import { useRouter } from 'expo-router';
import { useCallback } from 'react';

/** Opens the calendar on a civil date (YYYY-MM-DD) with that day's details shown. */
export function useOpenCalendarDate(): (dateGregorian: string) => void {
  const router = useRouter();
  return useCallback(
    (dateGregorian) => {
      router.navigate({ pathname: '/(app)/calendar', params: { date: dateGregorian } });
    },
    [router],
  );
}
