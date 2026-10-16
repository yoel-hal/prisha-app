import AsyncStorage from '@react-native-async-storage/async-storage';
import { reloadAppAsync } from 'expo';
import { I18nManager, Platform } from 'react-native';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { applyCalendarLocale } from './calendarLocale';
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
 * Native layout mirroring takes effect after the app restarts (see reloadIfDirectionMismatch).
 */
export function applyLanguageDirection(language: SupportedLanguage): void {
  const shouldUseRTL = language === 'he';
  applyCalendarLocale(language);
  I18nManager.allowRTL(shouldUseRTL);
  I18nManager.forceRTL(shouldUseRTL);

  // I18nManager has no effect in the browser; the document direction mirrors
  // flex rows, start/end spacing and text alignment there. Set on <body>, not
  // <html>: NativeWind watches <html> attributes and throws on any change.
  // public/index.html starts as Hebrew/RTL to avoid a flash before this runs.
  if (Platform.OS === 'web' && typeof document !== 'undefined' && document.body) {
    document.body.dir = shouldUseRTL ? 'rtl' : 'ltr';
    document.body.lang = language;
  }
}

const RTL_RELOAD_KEY = 'rtl_reload_for';

/**
 * Native layout direction only changes on the next app start, so restart once when it
 * doesn't match the language. The stored marker stops a reload loop if the platform
 * ignores forceRTL (e.g. RTL support missing from the build).
 */
async function reloadIfDirectionMismatch(language: SupportedLanguage): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }
  const wantRTL = language === 'he';
  if (I18nManager.isRTL === wantRTL) {
    await AsyncStorage.removeItem(RTL_RELOAD_KEY).catch(() => undefined);
    return;
  }
  const attemptedFor = await AsyncStorage.getItem(RTL_RELOAD_KEY).catch(() => null);
  if (attemptedFor === String(wantRTL)) {
    return;
  }
  await AsyncStorage.setItem(RTL_RELOAD_KEY, String(wantRTL)).catch(() => undefined);
  await reloadAppAsync('Apply layout direction for app language');
}

const LANGUAGE_STORAGE_KEY = 'app_language';
const DEFAULT_LANGUAGE: SupportedLanguage = 'he';

function isSupportedLanguage(value: string | null): value is SupportedLanguage {
  return value === 'he' || value === 'en';
}

export async function setAppLanguage(language: SupportedLanguage): Promise<void> {
  applyLanguageDirection(language);
  await i18n.changeLanguage(language);
  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language).catch(() => undefined);
  await reloadIfDirectionMismatch(language);
}

/**
 * Applies the language saved on this device (Hebrew if none). Call once at startup,
 * before the first screen renders, so a chosen language survives restarts.
 */
export async function restoreSavedLanguage(): Promise<void> {
  const saved = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY).catch(() => null);
  const language = isSupportedLanguage(saved) ? saved : DEFAULT_LANGUAGE;
  applyLanguageDirection(language);
  if (i18n.language !== language) {
    await i18n.changeLanguage(language);
  }
  await reloadIfDirectionMismatch(language);
}

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: DEFAULT_LANGUAGE,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    compatibilityJSON: 'v4',
  });

  // Direction is applied by restoreSavedLanguage() once the saved choice is known;
  // forcing Hebrew here would undo an English user's RTL setting on every launch.
  applyCalendarLocale(i18n.language);
}

export default i18n;
