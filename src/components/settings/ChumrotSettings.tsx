import { memo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type {
  Chumrot,
  Kavuah,
  NightConflictChoice,
  ShortMonthRule,
} from '../../calculations/types';
import { inputStartStyle, textStartStyle, useAlignStart } from '../../utils/rtl';
import { AppSwitch } from '../common/AppSwitch';

type Props = {
  chumrot: Chumrot;
  onChange: (next: Chumrot) => void;
};

const NIGHT_CONFLICT_OPTIONS: { value: NightConflictChoice; labelKey: string }[] = [
  { value: 'both', labelKey: 'chumrot.nightConflictBoth' },
  { value: 'ohrZarua', labelKey: 'chumrot.nightConflictOhrZarua' },
  { value: 'kreisiUpleisi', labelKey: 'chumrot.nightConflictKreisi' },
];

const SHORT_MONTH_OPTIONS: { value: ShortMonthRule; labelKey: string }[] = [
  { value: 'none', labelKey: 'chumrot.shortMonthNone' },
  { value: 'firstOfFollowing', labelKey: 'chumrot.shortMonthFirst' },
  { value: 'twentyNinth', labelKey: 'chumrot.shortMonthTwentyNinth' },
];

const KAVUAH_OPTIONS: { value: Kavuah['type']; labelKey: string }[] = [
  { value: 'none', labelKey: 'chumrot.kavuahNone' },
  { value: 'haflaga', labelKey: 'chumrot.kavuahHaflaga' },
  { value: 'chodesh', labelKey: 'chumrot.kavuahChodesh' },
];

const HAFLAGA_DAYS = { min: 2, max: 400, initial: 30 };
const DAY_OF_MONTH = { min: 1, max: 30, initial: 1 };

/** Chumrot and kavuah settings, shared by the settings screen and onboarding. */
function ChumrotSettingsImpl({ chumrot, onChange }: Props) {
  const { t } = useTranslation();
  const set = (patch: Partial<Chumrot>) => onChange({ ...chumrot, ...patch });

  return (
    <View style={styles.container}>
      <SwitchRow
        label={t('chumrot.ohrZarua')}
        description={t('chumrot.ohrZaruaDesc')}
        value={chumrot.ohrZarua}
        onValueChange={(ohrZarua) => set({ ohrZarua })}
      />
      <SwitchRow
        label={t('chumrot.kreisiUpleisi')}
        description={t('chumrot.kreisiUpleisiDesc')}
        value={chumrot.kreisiUpleisi}
        onValueChange={(kreisiUpleisi) => set({ kreisiUpleisi })}
      />
      {chumrot.ohrZarua && chumrot.kreisiUpleisi ? (
        <ChoiceRow
          label={t('chumrot.nightConflict')}
          description={t('chumrot.nightConflictDesc')}
          options={NIGHT_CONFLICT_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) }))}
          value={chumrot.nightConflict}
          onChange={(nightConflict) => set({ nightConflict })}
        />
      ) : null}
      <SwitchRow
        label={t('chumrot.chavotDaat')}
        description={t('chumrot.chavotDaatDesc')}
        value={chumrot.chavotDaat}
        onValueChange={(chavotDaat) => set({ chavotDaat })}
      />
      {chumrot.chavotDaat && chumrot.ohrZarua ? (
        <SwitchRow
          label={t('chumrot.ohrZaruaOnDay31')}
          description={t('chumrot.ohrZaruaOnDay31Desc')}
          value={chumrot.ohrZaruaOnDay31}
          onValueChange={(ohrZaruaOnDay31) => set({ ohrZaruaOnDay31 })}
        />
      ) : null}
      <ChoiceRow
        label={t('chumrot.shortMonth')}
        description={t('chumrot.shortMonthDesc')}
        options={SHORT_MONTH_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) }))}
        value={chumrot.shortMonthRule}
        onChange={(shortMonthRule) => set({ shortMonthRule })}
      />
      <KavuahRow
        kavuah={chumrot.kavuah}
        needsReview={chumrot.kavuahNeedsReview}
        onChange={(kavuah) => set({ kavuah, kavuahNeedsReview: false })}
      />
    </View>
  );
}

export const ChumrotSettings = memo(ChumrotSettingsImpl);

function SwitchRow({
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
      <View style={styles.textWrap}>
        <Text style={[styles.label, textStartStyle()]}>{label}</Text>
        <Text style={[styles.description, textStartStyle()]}>{description}</Text>
      </View>
      <AppSwitch value={value} onValueChange={onValueChange} />
    </View>
  );
}

function ChoiceRow<T extends string>({
  label,
  description,
  options,
  value,
  onChange,
}: {
  label: string;
  description?: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (next: T) => void;
}) {
  return (
    <View style={styles.choiceRow}>
      <Text style={[styles.label, textStartStyle()]}>{label}</Text>
      {description ? (
        <Text style={[styles.description, textStartStyle()]}>{description}</Text>
      ) : null}
      <View style={styles.options}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              style={[styles.option, selected && styles.optionSelected]}
              onPress={() => onChange(option.value)}
            >
              <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function KavuahRow({
  kavuah,
  needsReview,
  onChange,
}: {
  kavuah: Kavuah;
  needsReview: boolean;
  onChange: (next: Kavuah) => void;
}) {
  const { t } = useTranslation();
  const textAlign = useAlignStart();
  const savedNumber =
    kavuah.type === 'haflaga' ? kavuah.days : kavuah.type === 'chodesh' ? kavuah.dayOfMonth : null;
  const [text, setText] = useState(savedNumber === null ? '' : String(savedNumber));

  useEffect(() => {
    setText(savedNumber === null ? '' : String(savedNumber));
  }, [savedNumber]);

  const range = kavuah.type === 'haflaga' ? HAFLAGA_DAYS : DAY_OF_MONTH;
  const parsed = Number(text);
  const valid = Number.isInteger(parsed) && parsed >= range.min && parsed <= range.max;

  function selectType(type: Kavuah['type']) {
    if (type === kavuah.type) {
      return;
    }
    if (type === 'haflaga') {
      onChange({ type, days: HAFLAGA_DAYS.initial });
    } else if (type === 'chodesh') {
      onChange({ type, dayOfMonth: DAY_OF_MONTH.initial });
    } else {
      onChange({ type: 'none' });
    }
  }

  function commitNumber(value: string) {
    setText(value);
    const n = Number(value);
    if (!Number.isInteger(n) || n < range.min || n > range.max) {
      return;
    }
    if (kavuah.type === 'haflaga' && n !== kavuah.days) {
      onChange({ type: 'haflaga', days: n });
    } else if (kavuah.type === 'chodesh' && n !== kavuah.dayOfMonth) {
      onChange({ type: 'chodesh', dayOfMonth: n });
    }
  }

  return (
    <View style={styles.choiceRow}>
      <ChoiceRow
        label={t('chumrot.kavuah')}
        description={t('chumrot.kavuahDesc')}
        options={KAVUAH_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) }))}
        value={kavuah.type}
        onChange={selectType}
      />
      {needsReview ? (
        <Text style={[styles.notice, textStartStyle()]}>{t('chumrot.kavuahNeedsReview')}</Text>
      ) : null}
      {kavuah.type !== 'none' ? (
        <View style={styles.numberField}>
          <Text style={[styles.description, textStartStyle()]}>
            {t(kavuah.type === 'haflaga' ? 'chumrot.kavuahDays' : 'chumrot.kavuahDayOfMonth')}
          </Text>
          <TextInput
            style={[styles.numberInput, inputStartStyle(), { textAlign }]}
            value={text}
            onChangeText={commitNumber}
            keyboardType="number-pad"
            inputMode="numeric"
            maxLength={3}
            textAlign={textAlign}
          />
          {!valid ? (
            <Text style={[styles.error, textStartStyle()]}>
              {t('chumrot.kavuahInvalid', { min: range.min, max: range.max })}
            </Text>
          ) : null}
        </View>
      ) : null}
      <Text style={[styles.description, textStartStyle()]}>{t('chumrot.kavuahBothNote')}</Text>
    </View>
  );
}

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
  choiceRow: {
    gap: 8,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  textWrap: { flex: 1, gap: 4 },
  label: { fontSize: 16, fontWeight: '600' },
  description: { fontSize: 14, lineHeight: 20, color: '#666' },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  optionSelected: { backgroundColor: '#1a1a1a', borderColor: '#1a1a1a' },
  optionText: { fontSize: 15 },
  optionTextSelected: { color: '#fff', fontWeight: '600' },
  numberField: { gap: 6 },
  numberInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 16,
    width: 120,
  },
  notice: {
    fontSize: 14,
    lineHeight: 20,
    color: '#92400e',
    backgroundColor: '#fffbeb',
    borderRadius: 8,
    padding: 10,
  },
  error: { fontSize: 13, color: '#b91c1c' },
});
