import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { showToast } from '../utils/toast';
import { useDesktopWeb } from './useDesktopWeb';

/**
 * The one way settings confirm a save: a green "changes saved" toast.
 * Switches and choices save as soon as they change and stay on the page.
 * Screens with a Save button pass `goBack` and return to the settings list on the
 * phone; on desktop web the settings menu stays beside the page, so they stay.
 */
export function useSettingsSaved(): (options?: { goBack?: boolean }) => void {
  const { t } = useTranslation();
  const router = useRouter();
  const isDesktopWeb = useDesktopWeb();

  return useCallback(
    (options) => {
      showToast(t('settings.changesSaved'), 'success');
      if (options?.goBack && !isDesktopWeb && router.canGoBack()) {
        router.back();
      }
    },
    [isDesktopWeb, router, t],
  );
}
