import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import type { Minhag } from '../calculations/types';
import { setAppLanguage, type SupportedLanguage } from '../i18n';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';

const MINHAGIM: Minhag[] = [
  'ashkenaz',
  'sfarad',
  'chabad',
  'teimani',
  'yireim',
];

export function useSettings() {
  const { i18n } = useTranslation();
  const coupleId = useAuthStore((state) => state.coupleId);
  const minhag = useSettingsStore((state) => state.minhag);
  const setMinhag = useSettingsStore((state) => state.setMinhag);
  const loadSettings = useSettingsStore((state) => state.loadSettings);
  const saveSettings = useSettingsStore((state) => state.saveSettings);

  useEffect(() => {
    if (coupleId) {
      void loadSettings(coupleId);
    }
  }, [coupleId, loadSettings]);

  const selectMinhag = useCallback(
    async (next: Minhag) => {
      setMinhag(next);
      if (coupleId) {
        await saveSettings(coupleId);
      }
    },
    [coupleId, setMinhag, saveSettings],
  );

  const setLanguage = useCallback(async (language: SupportedLanguage) => {
    await setAppLanguage(language);
  }, []);

  return {
    minhag,
    minhagim: MINHAGIM,
    currentLanguage: i18n.language as SupportedLanguage,
    selectMinhag,
    setLanguage,
  };
}
