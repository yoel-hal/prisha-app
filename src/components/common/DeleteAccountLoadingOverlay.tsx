import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useAuthStore } from '../../store/authStore';

export function DeleteAccountLoadingOverlay() {
  const { t } = useTranslation();
  const isDeletingAccount = useAuthStore((state) => state.isDeletingAccount);

  if (!isDeletingAccount) {
    return null;
  }

  return (
    <View style={styles.overlay} pointerEvents="auto">
      <ActivityIndicator size="large" color="#fff" />
      <Text style={styles.text}>{t('deleteAccount.deleting')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    gap: 12,
    zIndex: 200,
  },
  text: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
});
