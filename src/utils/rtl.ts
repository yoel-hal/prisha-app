import { useTranslation } from 'react-i18next';
import { I18nManager, type TextStyle } from 'react-native';

import i18n from '../i18n';

function isHebrewLanguage(language: string): boolean {
  return language === 'he' || language.startsWith('he-');
}

/** RTL-safe text alignment based on active app language. */
export function alignStart(): 'left' | 'right' {
  return isHebrewLanguage(i18n.language) ? 'right' : 'left';
}

/** Re-renders when language changes; use for dynamic text alignment. */
export function useAlignStart(): 'left' | 'right' {
  const { i18n: i18nInstance } = useTranslation();
  return isHebrewLanguage(i18nInstance.language) ? 'right' : 'left';
}

/** Inline style helper — call at render time so alignment tracks language changes. */
export function textStartStyle(): Pick<TextStyle, 'textAlign'> {
  return { textAlign: alignStart() };
}

/** Whether layout should mirror (native RTL flag or Hebrew language). */
export function isAppRTL(): boolean {
  return I18nManager.isRTL || isHebrewLanguage(i18n.language);
}
