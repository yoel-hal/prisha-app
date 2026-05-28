import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Switch, Text, View } from 'react-native';

import type { Chumrot } from '../../calculations/types';
import { textStartStyle } from '../../utils/rtl';

type ChumraKey = keyof Chumrot;

const ROWS: { field: ChumraKey; labelKey: string; descriptionKey: string }[] = [
  {
    field: 'kavuah',
    labelKey: 'chumrot.kavuah',
    descriptionKey: 'chumrot.kavuahDesc',
  },
  {
    field: 'veshetEinah',
    labelKey: 'chumrot.veshetEinah',
    descriptionKey: 'chumrot.veshetEinahDesc',
  },
  {
    field: 'onahBeinonitIfHaflaga',
    labelKey: 'chumrot.onahBeinonitIfHaflaga',
    descriptionKey: 'chumrot.onahBeinonitIfHaflagaDesc',
  },
  {
    field: 'bothOnotOnBeinonit',
    labelKey: 'chumrot.bothOnotOnBeinonit',
    descriptionKey: 'chumrot.bothOnotOnBeinonitDesc',
  },
  {
    field: 'bothOnotOnYomHaChodesh',
    labelKey: 'chumrot.bothOnotOnYomHaChodesh',
    descriptionKey: 'chumrot.bothOnotOnYomHaChodeshDesc',
  },
];

type Props = {
  chumrot: Chumrot;
  onChange: (next: Chumrot) => void;
};

function ChumrotTogglesImpl({ chumrot, onChange }: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      {ROWS.map((row) => (
        <View key={row.field} style={styles.row}>
          <View style={styles.textWrap}>
            <Text style={[styles.label, textStartStyle()]}>{t(row.labelKey)}</Text>
            <Text style={[styles.description, textStartStyle()]}>
              {t(row.descriptionKey)}
            </Text>
          </View>
          <Switch
            value={chumrot[row.field]}
            onValueChange={(value) => onChange({ ...chumrot, [row.field]: value })}
          />
        </View>
      ))}
    </View>
  );
}

export const ChumrotToggles = memo(ChumrotTogglesImpl);

const styles = StyleSheet.create({
  container: { gap: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  textWrap: { flex: 1, gap: 4 },
  label: { fontSize: 16, fontWeight: '600' },
  description: { fontSize: 14, lineHeight: 20, color: '#666' },
});
