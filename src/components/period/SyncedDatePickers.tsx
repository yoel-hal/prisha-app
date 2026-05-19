import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { HDate, monthsInYear } from '@hebcal/hdate';
import { useTranslation } from 'react-i18next';
import { useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { HebrewDate } from '../../calculations/types';
import type { SupportedLanguage } from '../../i18n';
import { formatHebrewDate } from '../../utils/hebrewDateFormat';
import { textStartStyle } from '../../utils/rtl';

interface SyncedDatePickersProps {
  gregorianDate: Date;
  hebrewDate: HebrewDate;
  onGregorianChange: (date: Date) => void;
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

export function SyncedDatePickers({
  gregorianDate,
  hebrewDate,
  onGregorianChange,
  onHebrewChange,
}: SyncedDatePickersProps) {
  const { t, i18n } = useTranslation();
  const language = i18n.language as SupportedLanguage;
  const [showGregorianPicker, setShowGregorianPicker] = useState(
    Platform.OS === 'ios',
  );
  const [hebrewModalOpen, setHebrewModalOpen] = useState(false);

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

  function handleGregorianChange(
    _event: DateTimePickerEvent,
    selected?: Date,
  ) {
    if (Platform.OS === 'android') {
      setShowGregorianPicker(false);
    }
    if (selected) {
      onGregorianChange(selected);
    }
  }

  function updateHebrew(partial: Partial<HebrewDate>) {
    const next: HebrewDate = { ...hebrewDate, ...partial };
    const maxDay = new HDate(1, next.month, next.year).daysInMonth();
    if (next.day > maxDay) {
      next.day = maxDay;
    }
    onHebrewChange(next);
  }

  return (
    <View style={styles.section}>
      <Text style={[styles.label, textStartStyle()]}>{t('period.date')}</Text>

      <View style={styles.block}>
        <Text style={[styles.subLabel, textStartStyle()]}>
          {t('period.gregorian')}
        </Text>
        {Platform.OS === 'android' && !showGregorianPicker ? (
          <Pressable
            style={styles.dateButton}
            onPress={() => setShowGregorianPicker(true)}
          >
            <Text style={styles.dateButtonText}>
              {gregorianDate.toLocaleDateString(
                language === 'he' ? 'he-IL' : 'en-US',
              )}
            </Text>
          </Pressable>
        ) : null}
        {(Platform.OS === 'ios' || showGregorianPicker) && (
          <DateTimePicker
            value={gregorianDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleGregorianChange}
          />
        )}
      </View>

      <View style={styles.block}>
        <Text style={[styles.subLabel, textStartStyle()]}>{t('period.hebrew')}</Text>
        <Pressable
          style={styles.dateButton}
          onPress={() => setHebrewModalOpen(true)}
        >
          <Text style={styles.dateButtonText}>
            {formatHebrewDate(hebrewDate, language)}
          </Text>
        </Pressable>
      </View>

      <Modal
        visible={hebrewModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setHebrewModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={[styles.modalTitle, textStartStyle()]}>
              {t('period.date')}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.pickerRow}>
                <View style={styles.pickerColumn}>
                  <Text style={styles.columnLabel}>{t('onah.day')}</Text>
                  {dayOptions.map((day) => (
                    <Pressable
                      key={day}
                      style={[
                        styles.option,
                        hebrewDate.day === day && styles.optionSelected,
                      ]}
                      onPress={() => updateHebrew({ day })}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          hebrewDate.day === day && styles.optionTextSelected,
                        ]}
                      >
                        {day}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <View style={styles.pickerColumn}>
                  <Text style={styles.columnLabel}>{t('period.date')}</Text>
                  {monthOptions.map((month) => (
                    <Pressable
                      key={month.value}
                      style={[
                        styles.option,
                        hebrewDate.month === month.value && styles.optionSelected,
                      ]}
                      onPress={() => updateHebrew({ month: month.value })}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          hebrewDate.month === month.value &&
                            styles.optionTextSelected,
                        ]}
                      >
                        {month.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <View style={styles.pickerColumn}>
                  <Text style={styles.columnLabel}>{t('period.year')}</Text>
                  {yearOptions.map((year) => (
                    <Pressable
                      key={year}
                      style={[
                        styles.option,
                        hebrewDate.year === year && styles.optionSelected,
                      ]}
                      onPress={() => updateHebrew({ year })}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          hebrewDate.year === year && styles.optionTextSelected,
                        ]}
                      >
                        {year}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </ScrollView>
            <Pressable
              style={styles.doneButton}
              onPress={() => setHebrewModalOpen(false)}
            >
              <Text style={styles.doneButtonText}>{t('common.done')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  subLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  block: {
    gap: 8,
  },
  dateButton: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'flex-start',
  },
  dateButtonText: {
    fontSize: 16,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopStartRadius: 16,
    borderTopEndRadius: 16,
    padding: 20,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  pickerRow: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 12,
  },
  pickerColumn: {
    minWidth: 88,
    gap: 4,
  },
  columnLabel: {
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
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
  },
  optionTextSelected: {
    color: '#fff',
  },
  doneButton: {
    marginTop: 12,
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
