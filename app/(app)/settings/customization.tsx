import { Stack } from 'expo-router';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Chumrot, Minhag } from '../../../src/calculations/types';
import { ChumrotSettings } from '../../../src/components/settings/ChumrotSettings';
import { useDesktopWeb } from '../../../src/hooks/useDesktopWeb';
import { useSettings } from '../../../src/hooks/useSettings';
import { useSettingsSaved } from '../../../src/hooks/useSettingsSaved';
import { textStartStyle } from '../../../src/utils/rtl';
import { webScreenScrollStyles } from '../../../src/utils/webScroll';

const MINHAGIM: Minhag[] = [
  'ashkenaz',
  'sfarad',
  'chabad',
  'teimani',
];

const DESC_KEYS: Record<Minhag, string> = {
  ashkenaz: 'minhag.ashkenazDesc',
  sfarad: 'minhag.sfaradDesc',
  chabad: 'minhag.chabadDesc',
  teimani: 'minhag.teimaniDesc',
};

export default function CustomizationScreen() {
  const webScroll = webScreenScrollStyles();
  const isDesktopWeb = useDesktopWeb();
  const { t } = useTranslation();
  const { minhag, chumrot, selectMinhag, selectChumrot } = useSettings();
  const settingsSaved = useSettingsSaved();

  // Choices save as soon as they change (no confirm button), like the other settings.
  const changeMinhag = useCallback(
    async (next: Minhag) => {
      if (next === minhag) {
        return;
      }
      await selectMinhag(next);
      settingsSaved();
    },
    [minhag, selectMinhag, settingsSaved],
  );

  const changeChumrot = useCallback(
    async (next: Chumrot) => {
      await selectChumrot(next);
      settingsSaved();
    },
    [selectChumrot, settingsSaved],
  );

  const body = (
    <>
        <ScrollView style={webScroll.scroll} contentContainerStyle={styles.scroll}>
          <Text style={[styles.header, textStartStyle()]}>
            {t('settings.minhag')}
          </Text>

          <View style={styles.cardList}>
            {MINHAGIM.map((item) => (
              <MinhagCard
                key={item}
                value={item}
                selected={minhag === item}
                onSelect={() => void changeMinhag(item)}
              />
            ))}
          </View>

          <Text style={[styles.header, styles.sectionGap, textStartStyle()]}>
            {t('settings.chumrot')}
          </Text>

          <ChumrotSettings chumrot={chumrot} onChange={(next) => void changeChumrot(next)} />
        </ScrollView>

    </>
  );

  if (isDesktopWeb) {
    return <View style={styles.safe}>{body}</View>;
  }

  return (
    <>
      <Stack.Screen options={{ title: t('settings.customization') }} />
      <SafeAreaView style={[styles.safe, webScroll.safe]} edges={['bottom']}>
        {body}
      </SafeAreaView>
    </>
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
    padding: 20,
    paddingBottom: 24,
    gap: 12,
  },
  header: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  sectionGap: {
    marginTop: 24,
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
});
