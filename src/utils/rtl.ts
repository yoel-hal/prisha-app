import { useTranslation } from 'react-i18next';
import { I18nManager, Platform, type TextStyle } from 'react-native';

import i18n from '../i18n';

function isHebrewLanguage(language: string): boolean {
  return language === 'he' || language.startsWith('he-');
}

/**
 * Start-side alignment for TextInputs: physical 'right' for Hebrew, 'left' for English.
 * Inputs do not swap left/right in native RTL, so the physical side is what they need.
 */
export function alignStart(): 'left' | 'right' {
  return isHebrewLanguage(i18n.language) ? 'right' : 'left';
}

/** Re-renders when language changes; TextInput alignment (see alignStart). */
export function useAlignStart(): 'left' | 'right' {
  const { i18n: i18nInstance } = useTranslation();
  return isHebrewLanguage(i18nInstance.language) ? 'right' : 'left';
}

/** Style helper for TextInputs — call at render time so alignment tracks language changes. */
export function inputStartStyle(): Pick<TextStyle, 'textAlign'> {
  return { textAlign: alignStart() };
}

/**
 * Start-side alignment for Text. In native RTL layout (I18nManager.isRTL) React Native
 * swaps 'left'/'right' on Text, so 'left' already means the start side. When the native
 * direction matches the language use 'left'; otherwise (web, or a native launch before
 * the direction change has applied) use the physical side.
 */
export function textStartStyle(): Pick<TextStyle, 'textAlign'> {
  const hebrew = isHebrewLanguage(i18n.language);
  if (Platform.OS !== 'web' && I18nManager.isRTL === hebrew) {
    return { textAlign: 'left' };
  }
  return { textAlign: hebrew ? 'right' : 'left' };
}

/** Whether layout should mirror (native RTL flag or Hebrew language). */
export function isAppRTL(): boolean {
  return I18nManager.isRTL || isHebrewLanguage(i18n.language);
}
