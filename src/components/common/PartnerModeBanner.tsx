import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { signOut } from '../../firebase/auth';
import { useAuthStore } from '../../store/authStore';
import { useOnboardingStore } from '../../store/onboardingStore';
import { clearPartnerSession } from '../../utils/partnerSession';

export function PartnerModeBanner() {
  const { t } = useTranslation();
  const { isPartnerMode, ownerName } = useAuthStore();
  const router = useRouter();

  if (!isPartnerMode) return null;

  async function handleExit() {
    await clearPartnerSession();
    useAuthStore.getState().setPartnerMode(false, null, null);
    useAuthStore.getState().setCoupleId(null);
    useOnboardingStore.getState().reset();
    await signOut();
    router.replace('/onboarding/welcome');
  }

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>
        👁 {t('partner.viewingApp', { name: ownerName })}
      </Text>
      <Pressable onPress={() => void handleExit()} style={styles.exit}>
        <Text style={styles.exitText}>{t('partner.exit')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#f0f4ff',
    borderBottomWidth: 1,
    borderBottomColor: '#c7d4f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  text: { fontSize: 13, color: '#3a5a9a', flex: 1 },
  exit: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#3a5a9a',
    borderRadius: 6,
  },
  exitText: { color: '#fff', fontSize: 13 },
});
