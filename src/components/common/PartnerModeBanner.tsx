import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { signOut } from '../../firebase/auth';
import { Icon } from './Icon';
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
      <View style={styles.label}>
        <Icon name="eye" size={16} color="#8F3B50" />
        <Text style={styles.text}>{t('partner.viewingApp', { name: ownerName })}</Text>
      </View>
      <Pressable onPress={() => void handleExit()} style={styles.exit}>
        <Text style={styles.exitText}>{t('partner.exit')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#F6E9EC',
    borderBottomWidth: 1,
    borderBottomColor: '#E8CDD4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  label: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  text: { fontSize: 13, color: '#8F3B50', flexShrink: 1 },
  exit: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#A8485F',
    borderRadius: 8,
  },
  exitText: { color: '#fff', fontSize: 13 },
});
