import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Chumrot } from '../../src/calculations/types';
import OnboardingSkipButton from '../../src/components/onboarding/OnboardingSkipButton';
import { useSettings } from '../../src/hooks/useSettings';
import { textStartStyle } from '../../src/utils/rtl';

const DEFAULT_CHUMROT: Chumrot = {
  kavuah: false,
  veshetEinah: false,
  onahBeinonitIfHaflaga: false,
};

type ChumraKey = keyof Chumrot;

const CHUMRA_ROWS: { key: ChumraKey; labelKey: string; descKey: string }[] = [
  { key: 'kavuah', labelKey: 'chumrot.kavuah', descKey: 'chumrot.kavuahDesc' },
  {
    key: 'veshetEinah',
    labelKey: 'chumrot.veshetEinah',
    descKey: 'chumrot.veshetEinahDesc',
  },
  {
    key: 'onahBeinonitIfHaflaga',
    labelKey: 'chumrot.onahBeinonitIfHaflaga',
    descKey: 'chumrot.onahBeinonitIfHaflagaDesc',
  },
];

export default function OnboardingChumrotScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { selectChumrot } = useSettings();
  const [chumrot, setChumrot] = useState<Chumrot>(DEFAULT_CHUMROT);
  const [saving, setSaving] = useState(false);

  const goNext = useCallback(
    async (next: Chumrot) => {
      setSaving(true);
      await selectChumrot(next);
      setSaving(false);
      router.push('/onboarding/done');
    },
    [selectChumrot, router],
  );

  function toggle(key: ChumraKey, value: boolean) {
    setChumrot((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <OnboardingSkipButton onSkip={() => void goNext(DEFAULT_CHUMROT)} />

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.title, textStartStyle()]}>{t('onboarding.chumrot')}</Text>
        <Text style={[styles.subtitle, textStartStyle()]}>
          {t('onboarding.chumrotDesc')}
        </Text>

        <View style={styles.rows}>
          {CHUMRA_ROWS.map((row) => (
            <ChumraRow
              key={row.key}
              label={t(row.labelKey)}
              description={t(row.descKey)}
              value={chumrot[row.key]}
              onValueChange={(value) => toggle(row.key, value)}
            />
          ))}
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

function ChumraRow({
  label,
  description,
  value,
  onValueChange,
}: {
  label: string;
  description: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, textStartStyle()]}>{label}</Text>
        <Text style={[styles.rowDesc, textStartStyle()]}>{description}</Text>
      </View>
      <Switch value={value} onValueChange={onValueChange} />
    </View>
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  rowText: {
    flex: 1,
    gap: 4,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  rowDesc: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
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
