import { HDate, monthsInYear } from '@hebcal/hdate';
import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { HebrewDate } from '../../calculations/types';
import { textStartStyle } from '../../utils/rtl';

interface HebrewDatePickerInlineProps {
  hebrewDate: HebrewDate;
  onHebrewChange: (date: HebrewDate) => void;
}

function buildMonthOptions(year: number): { label: string; value: number }[] {
  const count = monthsInYear(year);
  const options: { label: string; value: number }[] = [];
  for (let month = 1; month <= count; month += 1) {
    const hdate = new HDate(1, month, year);
    options.push({ label: hdate.getMonthName(), value: month });
  }
  return options;
}

export function HebrewDatePickerInline({
  hebrewDate,
  onHebrewChange,
}: HebrewDatePickerInlineProps) {
  const { t } = useTranslation();

  const monthOptions = useMemo(
    () => buildMonthOptions(hebrewDate.year),
    [hebrewDate.year],
  );

  const dayOptions = useMemo(() => {
    const hdate = new HDate(hebrewDate.day, hebrewDate.month, hebrewDate.year);
    const days = hdate.daysInMonth();
    return Array.from({ length: days }, (_, index) => index + 1);
  }, [hebrewDate.day, hebrewDate.month, hebrewDate.year]);

  const yearOptions = useMemo(() => {
    const current = new HDate().getFullYear();
    const start = current - 5;
    const end = current + 1;
    const years: number[] = [];
    for (let year = start; year <= end; year += 1) {
      years.push(year);
    }
    return years;
  }, []);

  function updateHebrew(partial: Partial<HebrewDate>) {
    const next: HebrewDate = { ...hebrewDate, ...partial };
    const maxDay = new HDate(1, next.month, next.year).daysInMonth();
    if (next.day > maxDay) {
      next.day = maxDay;
    }
    onHebrewChange(next);
  }

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.subLabel, textStartStyle()]}>{t('period.hebrew')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.pickerRow}>
          <PickerColumn label={t('onah.day')}>
            {dayOptions.map((day) => (
              <PickerOption
                key={day}
                label={String(day)}
                selected={hebrewDate.day === day}
                onPress={() => updateHebrew({ day })}
              />
            ))}
          </PickerColumn>
          <PickerColumn label={t('period.date')}>
            {monthOptions.map((month) => (
              <PickerOption
                key={month.value}
                label={month.label}
                selected={hebrewDate.month === month.value}
                onPress={() => updateHebrew({ month: month.value })}
              />
            ))}
          </PickerColumn>
          <PickerColumn label={t('period.year')}>
            {yearOptions.map((year) => (
              <PickerOption
                key={year}
                label={String(year)}
                selected={hebrewDate.year === year}
                onPress={() => updateHebrew({ year })}
              />
            ))}
          </PickerColumn>
        </View>
      </ScrollView>
    </View>
  );
}

function PickerColumn({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.pickerColumn}>
      <Text style={styles.columnLabel}>{label}</Text>
      <ScrollView style={styles.columnScroll} nestedScrollEnabled>
        {children}
      </ScrollView>
    </View>
  );
}

function PickerOption({
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
      style={[styles.option, selected && styles.optionSelected]}
      onPress={onPress}
    >
      <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  subLabel: {
    fontSize: 14,
    color: '#666',
  },
  pickerRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 8,
  },
  pickerColumn: {
    minWidth: 100,
    maxHeight: 200,
    gap: 4,
  },
  columnLabel: {
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
    fontSize: 13,
  },
  columnScroll: {
    maxHeight: 180,
  },
  option: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  optionSelected: {
    backgroundColor: '#1a1a1a',
  },
  optionText: {
    textAlign: 'center',
    fontSize: 15,
  },
  optionTextSelected: {
    color: '#fff',
  },
});
