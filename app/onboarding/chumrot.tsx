import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DEFAULT_CHUMROT } from '../../src/calculations/chumrot';
import type { Chumrot } from '../../src/calculations/types';
import { ChumrotSettings } from '../../src/components/settings/ChumrotSettings';
import OnboardingSkipButton from '../../src/components/onboarding/OnboardingSkipButton';
import { useOnboardingStore } from '../../src/store/onboardingStore';
import { textStartStyle } from '../../src/utils/rtl';
import { webScreenScrollStyles } from '../../src/utils/webScroll';


export default function OnboardingChumrotScreen() {
  const webScroll = webScreenScrollStyles();
  const { t } = useTranslation();
  const router = useRouter();
  const setStoreChumrot = useOnboardingStore((state) => state.setChumrot);
  const [chumrot, setChumrot] = useState<Chumrot>(DEFAULT_CHUMROT);
  const [saving, setSaving] = useState(false);

  const goNext = useCallback(
    (next: Chumrot) => {
      setSaving(true);
      setStoreChumrot(next);
      console.log(
        '[onboarding chumrot] store before done',
        useOnboardingStore.getState(),
      );
      setSaving(false);
      router.push('/onboarding/done');
    },
    [setStoreChumrot, router],
  );

  return (
    <SafeAreaView style={[styles.safe, webScroll.safe]} edges={['top', 'bottom']}>
      <OnboardingSkipButton onSkip={() => void goNext(DEFAULT_CHUMROT)} />

      <ScrollView style={webScroll.scroll} contentContainerStyle={styles.scroll}>
        <Text style={[styles.title, textStartStyle()]}>{t('onboarding.chumrot')}</Text>
        <Text style={[styles.subtitle, textStartStyle()]}>
          {t('onboarding.chumrotDesc')}
        </Text>

        <View style={styles.rows}>
          <ChumrotSettings chumrot={chumrot} onChange={setChumrot} />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.primaryButton, saving && styles.primaryDisabled]}
          onPress={() => void goNext(chumrot)}
          disabled={saving}
        >
          <Text style={styles.primaryButtonText}>{t('onboarding.continue')}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 24,
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: '#666',
    marginBottom: 8,
  },
  rows: {
    gap: 4,
    marginTop: 8,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#eee',
  },
  primaryButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
