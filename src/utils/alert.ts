import { Alert, Platform } from 'react-native';

export type AlertButton = {
  text?: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

/**
 * Cross-platform alert. React Native's Alert.alert is not implemented on web.
 */
export function showAlert(
  title: string,
  message?: string,
  buttons?: AlertButton[],
): void {
  if (Platform.OS !== 'web') {
    Alert.alert(title, message, buttons);
    return;
  }

  const body = message ? `${title}\n\n${message}` : title;

  if (!buttons || buttons.length === 0) {
    window.alert(body);
    return;
  }

  if (buttons.length === 1) {
    window.alert(body);
    buttons[0]?.onPress?.();
    return;
  }

  const cancelButton = buttons.find((button) => button.style === 'cancel');
  const actionButtons = buttons.filter((button) => button.style !== 'cancel');
  const primaryAction =
    actionButtons.find((button) => button.style === 'destructive') ??
    actionButtons[0];

  const confirmed = window.confirm(body);
  if (confirmed) {
    primaryAction?.onPress?.();
  } else {
    cancelButton?.onPress?.();
  }
}
