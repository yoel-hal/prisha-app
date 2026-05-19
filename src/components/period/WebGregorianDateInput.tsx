import { Platform, StyleSheet, Text, TextInput, View } from 'react-native';

import { textStartStyle } from '../../utils/rtl';

interface WebGregorianDateInputProps {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
}

function toInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function fromInputValue(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }
  const parsed = new Date(`${value}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function WebGregorianDateInput({
  label,
  value,
  onChange,
}: WebGregorianDateInputProps) {
  if (Platform.OS !== 'web') {
    return null;
  }

  return (
    <View style={styles.block}>
      <Text style={[styles.subLabel, textStartStyle()]}>{label}</Text>
      <TextInput
        value={toInputValue(value)}
        onChangeText={(text) => {
          const next = fromInputValue(text);
          if (next) {
            onChange(next);
          }
        }}
        style={styles.input}
        // Web-only: renders native <input type="date">
        {...({ type: 'date' } as object)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: 8,
  },
  subLabel: {
    fontSize: 14,
    color: '#666',
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    backgroundColor: '#fff',
    minHeight: 48,
  },
});
