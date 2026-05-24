import { Alert } from 'react-native';
import type { TFunction } from 'i18next';

export function showDeleteAccountAlert(t: TFunction): void {
  Alert.alert(
    t('settings.deleteAccountConfirmTitle'),
    t('settings.deleteAccountConfirmMessage'),
    [
      { text: t('settings.cancel'), style: 'cancel' },
      {
        text: t('settings.deleteAccountConfirmTitle'),
        style: 'destructive',
        onPress: () => {
          Alert.alert(t('settings.deleteAccountComingSoon'), '');
        },
      },
    ],
  );
}
