import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Minhag } from '../../calculations/types';
import { textStartStyle } from '../../utils/rtl';

const MINHAGIM: Minhag[] = ['ashkenaz', 'sfarad', 'chabad', 'teimani'];

const DESC_KEYS: Record<Minhag, string> = {
  ashkenaz: 'minhag.ashkenazDesc',
  sfarad: 'minhag.sfaradDesc',
  chabad: 'minhag.chabadDesc',
  teimani: 'minhag.teimaniDesc',
};

type Props = {
  selected: Minhag;
  onSelect: (minhag: Minhag) => void;
};

function MinhagSelectorImpl({ selected, onSelect }: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      {MINHAGIM.map((value) => (
        <Pressable
          key={value}
          style={[styles.card, selected === value && styles.cardSelected]}
          onPress={() => onSelect(value)}
        >
          <Text
            style={[
              styles.cardTitle,
              textStartStyle(),
              selected === value && styles.cardTitleSelected,
            ]}
          >
            {t(`minhag.${value}`, { lng: 'he' })} · {t(`minhag.${value}`, { lng: 'en' })}
          </Text>
          <Text
            style={[
              styles.cardDesc,
              textStartStyle(),
              selected === value && styles.cardDescSelected,
            ]}
          >
            {t(DESC_KEYS[value])}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export const MinhagSelector = memo(MinhagSelectorImpl);

const styles = StyleSheet.create({
  container: { gap: 12 },
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
