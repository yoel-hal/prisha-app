import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuthStore } from '../../store/authStore';
import { textStartStyle } from '../../utils/rtl';

export function PendingInviteGlobalBanner() {
  const { t } = useTranslation();
  const router = useRouter();
  const pendingInvite = useAuthStore((state) => state.pendingInvite);

  if (!pendingInvite) {
    return null;
  }

  return (
    <Pressable
      style={styles.banner}
      onPress={() => router.push('/settings/couple')}
      accessibilityRole="button"
    >
      <View style={styles.content}>
        <Text style={[styles.text, textStartStyle()]} numberOfLines={2}>
          {t('couple.globalBanner')}
        </Text>
        <Text style={styles.chevron}>›</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#1565C0',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#0D47A1',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  text: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  chevron: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
});
