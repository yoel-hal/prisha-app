import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Onah } from '../../calculations/types';
import { textStartStyle } from '../../utils/rtl';

interface OnahPickerProps {
  value: Onah;
  onChange: (onah: Onah) => void;
}

export function OnahPicker({ value, onChange }: OnahPickerProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Text style={[styles.label, textStartStyle()]}>{t('period.onah')}</Text>
      <View style={styles.row}>
        <Pressable
          style={[styles.button, value === 'day' && styles.buttonSelected]}
          onPress={() => onChange('day')}
        >
          <Text
            style={[
              styles.buttonText,
              value === 'day' && styles.buttonTextSelected,
            ]}
          >
            {t('period.day')}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.button, value === 'night' && styles.buttonSelected]}
          onPress={() => onChange('night')}
        >
          <Text
            style={[
              styles.buttonText,
              value === 'night' && styles.buttonTextSelected,
            ]}
          >
            {t('period.night')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonSelected: {
    backgroundColor: '#1a1a1a',
    borderColor: '#1a1a1a',
  },
  buttonText: {
    fontSize: 16,
  },
  buttonTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
});
