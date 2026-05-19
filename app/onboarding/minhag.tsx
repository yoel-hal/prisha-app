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

import OnboardingSkipButton from '../../src/components/onboarding/OnboardingSkipButton';
import type { Minhag } from '../../src/calculations/types';
import { useSettings } from '../../src/hooks/useSettings';
import { textStartStyle } from '../../src/utils/rtl';

const MINHAGIM: Minhag[] = [
  'ashkenaz',
  'sfarad',
  'chabad',
  'teimani',
  'yireim',
];

const DESC_KEYS: Record<Minhag, string> = {
  ashkenaz: 'minhag.ashkenazDesc',
  sfarad: 'minhag.sfaradDesc',
  chabad: 'minhag.chabadDesc',
  teimani: 'minhag.teimaniDesc',
  yireim: 'minhag.yireimDesc',
};

export default function OnboardingMinhagScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { selectMinhag } = useSettings();
  const [selected, setSelected] = useState<Minhag>('ashkenaz');
  const [saving, setSaving] = useState(false);

  const goNext = useCallback(
    async (minhag: Minhag) => {
      setSaving(true);
      await selectMinhag(minhag);
      setSaving(false);
      router.push('/onboarding/chumrot');
    },
    [selectMinhag, router],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <OnboardingSkipButton onSkip={() => void goNext('ashkenaz')} />

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.title, textStartStyle()]}>{t('onboarding.chooseMinhag')}</Text>

        <View style={styles.cardList}>
          {MINHAGIM.map((item) => (
            <MinhagCard
              key={item}
              value={item}
              selected={selected === item}
              onSelect={() => setSelected(item)}
            />
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.primaryButton, saving && styles.primaryDisabled]}
          onPress={() => void goNext(selected)}
          disabled={saving}
        >
          <Text style={styles.primaryButtonText}>{t('onboarding.continue')}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function MinhagCard({
  value,
  selected,
  onSelect,
}: {
  value: Minhag;
  selected: boolean;
  onSelect: () => void;
}) {
  const { t } = useTranslation();

  return (
    <Pressable
      style={[styles.card, selected && styles.cardSelected]}
      onPress={onSelect}
    >
      <Text
        style={[
          styles.cardTitle,
          textStartStyle(),
          selected && styles.cardTitleSelected,
        ]}
      >
        {t(`minhag.${value}`, { lng: 'he' })} · {t(`minhag.${value}`, { lng: 'en' })}
      </Text>
      <Text
        style={[
          styles.cardDesc,
          textStartStyle(),
          selected && styles.cardDescSelected,
        ]}
      >
        {t(DESC_KEYS[value])}
      </Text>
    </Pressable>
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
    gap: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardList: {
    gap: 12,
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  cardSelected: {
    backgroundColor: '#1a1a1a',
    borderColor: '#1a1a1a',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  cardTitleSelected: {
    color: '#fff',
  },
  cardDesc: {
    fontSize: 14,
    lineHeight: 20,
    color: '#555',
  },
  cardDescSelected: {
    color: '#e0e0e0',
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
