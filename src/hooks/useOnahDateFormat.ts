import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { formatGregorianLocal, hebrewDateToGregorian } from '../calculations/onah';
import type { HebrewDate, Onah } from '../calculations/types';
import type { SupportedLanguage } from '../i18n';
import { resolveZmanimLocation, useZmanimLocationStore } from '../store/zmanimLocationStore';
import { formatOnahDate, type OnahDateText } from '../utils/onahDisplay';
import { onahBounds } from '../utils/zmanim';

/** `formatOnahDate` bound to the current language and the sunset/sunrise location. */
export function useOnahDateFormat(): (date: HebrewDate, onah: Onah) => OnahDateText {
  const { t, i18n } = useTranslation();
  const language = i18n.language as SupportedLanguage;
  const choice = useZmanimLocationStore((state) => state.choice);
  return useCallback(
    (date, onah) => {
      const place = resolveZmanimLocation(choice).place;
      const dateGregorian = formatGregorianLocal(hebrewDateToGregorian(date));
      return formatOnahDate(
        date,
        onah,
        language,
        (key, options) => t(key, options),
        onahBounds({ dateGregorian, onah }, place),
      );
    },
    [choice, language, t],
  );
}
