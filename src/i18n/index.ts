import { DevSettings, I18nManager, Platform } from 'react-native';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import he from './locales/he.json';

export const resources = {
  en: { translation: en },
  he: { translation: he },
} as const;

export type SupportedLanguage = keyof typeof resources;

/**
 * Applies RTL/LTR direction based on selected app language.
 * Hebrew → RTL; English → LTR.
 * Native layout mirroring may require an app reload after toggling direction.
 */
export function applyLanguageDirection(language: SupportedLanguage): void {
  const shouldUseRTL = language === 'he';
  I18nManager.allowRTL(shouldUseRTL);
  I18nManager.forceRTL(shouldUseRTL);
}

function reloadAppIfNeeded(directionChanged: boolean): void {
  if (!directionChanged || Platform.OS === 'web') {
    return;
  }
  if (__DEV__ && typeof DevSettings.reload === 'function') {
    DevSettings.reload();
  }
}

export async function setAppLanguage(language: SupportedLanguage): Promise<void> {
  const shouldUseRTL = language === 'he';
  const directionChanged = I18nManager.isRTL !== shouldUseRTL;

  applyLanguageDirection(language);
  await i18n.changeLanguage(language);
  reloadAppIfNeeded(directionChanged);
}

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: 'he',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    compatibilityJSON: 'v4',
  });

  applyLanguageDirection(i18n.language as SupportedLanguage);
}

export default i18n;
