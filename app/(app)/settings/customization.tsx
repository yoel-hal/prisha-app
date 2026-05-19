import { Stack, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
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

import type { Chumrot, Minhag } from '../../../src/calculations/types';
import { useDesktopWeb } from '../../../src/hooks/useDesktopWeb';
import { useSettings } from '../../../src/hooks/useSettings';
import { textStartStyle } from '../../../src/utils/rtl';
import { webScreenScrollStyles } from '../../../src/utils/webScroll';

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

export default function CustomizationScreen() {
  const webScroll = webScreenScrollStyles();
  const isDesktopWeb = useDesktopWeb();
  const { t } = useTranslation();
  const router = useRouter();
  const { minhag, chumrot, selectMinhag, selectChumrot } = useSettings();
  const [pending, setPending] = useState<Minhag>(minhag);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setPending(minhag);
  }, [minhag]);

  const handleConfirm = useCallback(async () => {
    setSaving(true);
    await selectMinhag(pending);
    setSaving(false);
    if (!isDesktopWeb) {
      router.back();
    }
  }, [pending, selectMinhag, router, isDesktopWeb]);

  const toggleChumra = useCallback(
    (key: ChumraKey, value: boolean) => {
      void selectChumrot({ ...chumrot, [key]: value });
    },
    [chumrot, selectChumrot],
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
                selected={pending === item}
                onSelect={() => setPending(item)}
              />
            ))}
          </View>

          <Text style={[styles.header, styles.sectionGap, textStartStyle()]}>
            {t('settings.chumrot')}
          </Text>

          <View style={styles.chumrotRows}>
            {CHUMRA_ROWS.map((row) => (
              <ChumraRow
                key={row.key}
                label={t(row.labelKey)}
                description={t(row.descKey)}
                value={chumrot[row.key]}
                onValueChange={(value) => toggleChumra(row.key, value)}
              />
            ))}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            style={[styles.confirmButton, saving && styles.confirmDisabled]}
            onPress={() => void handleConfirm()}
            disabled={saving}
          >
            <Text style={styles.confirmText}>{t('minhag.confirm')}</Text>
          </Pressable>
        </View>
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
    <View style={styles.chumrotRow}>
      <View style={styles.chumrotRowText}>
        <Text style={[styles.chumrotRowLabel, textStartStyle()]}>{label}</Text>
        <Text style={[styles.chumrotRowDesc, textStartStyle()]}>{description}</Text>
      </View>
      <Switch value={value} onValueChange={onValueChange} />
    </View>
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
  chumrotRows: {
    gap: 4,
  },
  chumrotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  chumrotRowText: {
    flex: 1,
    gap: 4,
  },
  chumrotRowLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  chumrotRowDesc: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
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
  confirmButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
  },
  confirmDisabled: {
    opacity: 0.6,
  },
  confirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
