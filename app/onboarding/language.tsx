import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { setAppLanguage, type SupportedLanguage } from '../../src/i18n';

export default function LanguageScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [selected, setSelected] = useState<SupportedLanguage>('en');

  async function selectLanguage(language: SupportedLanguage) {
    setSelected(language);
    await setAppLanguage(language);
  }

  async function handleContinue() {
    await setAppLanguage(selected);
    router.push('/onboarding/auth');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <Text style={styles.title}>{t('onboarding.chooseLanguage')}</Text>

        <View style={styles.cards}>
          <LanguageCard
            label="English"
            selected={selected === 'en'}
            onPress={() => void selectLanguage('en')}
          />
          <LanguageCard
            label="עברית"
            selected={selected === 'he'}
            onPress={() => void selectLanguage('he')}
          />
        </View>

        <Pressable style={styles.primaryButton} onPress={() => void handleContinue()}>
          <Text style={styles.primaryButtonText}>{t('onboarding.continue')}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function LanguageCard({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.card, selected && styles.cardSelected]}
      onPress={onPress}
    >
      <Text style={[styles.cardLabel, selected && styles.cardLabelSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    gap: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 30,
  },
  cards: {
    gap: 16,
    flex: 1,
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
    borderRadius: 14,
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardSelected: {
    backgroundColor: '#1a1a1a',
    borderColor: '#1a1a1a',
  },
  cardLabel: {
    fontSize: 22,
    fontWeight: '600',
  },
  cardLabelSelected: {
    color: '#fff',
  },
  primaryButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
});
