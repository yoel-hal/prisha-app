import { I18nManager } from 'react-native';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import he from './locales/he.json';

export const resources = {
  en: { translation: en },
  he: { translation: he },
} as const;

export type SupportedLanguage = keyof typeof resources;

const RTL_LANGUAGES: SupportedLanguage[] = ['he'];

/**
 * Applies RTL/LTR direction based on selected app language.
 * Note: switching direction at runtime may require an app reload in React Native.
 */
export function applyLanguageDirection(language: SupportedLanguage): void {
  const shouldUseRTL = RTL_LANGUAGES.includes(language);
  I18nManager.allowRTL(shouldUseRTL);
  I18nManager.forceRTL(shouldUseRTL);
}

export async function setAppLanguage(language: SupportedLanguage): Promise<void> {
  applyLanguageDirection(language);
  await i18n.changeLanguage(language);
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
