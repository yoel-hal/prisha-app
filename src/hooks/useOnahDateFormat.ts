import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import type { HebrewDate, Onah } from '../calculations/types';
import type { SupportedLanguage } from '../i18n';
import { formatOnahDate, type OnahDateText } from '../utils/onahDisplay';

/** `formatOnahDate` bound to the current language. */
export function useOnahDateFormat(): (date: HebrewDate, onah: Onah) => OnahDateText {
  const { t, i18n } = useTranslation();
  const language = i18n.language as SupportedLanguage;
  return useCallback(
    (date, onah) => formatOnahDate(date, onah, language, (key, options) => t(key, options)),
    [language, t],
  );
}
