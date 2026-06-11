import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { formatGregorianLocal } from '../../calculations/onah';
import type { Period } from '../../calculations/types';
import { usePeriodForm } from '../../hooks/usePeriodForm';
import { useAuthStore } from '../../store/authStore';
import { usePeriodDraftStore } from '../../store/periodDraftStore';
import { showAlert } from '../../utils/alert';
import { useAlignStart, textStartStyle } from '../../utils/rtl';
import { OnahPicker } from './OnahPicker';
import { SyncedDatePickers } from './SyncedDatePickers';

export interface PeriodFormProps {
  existingPeriod?: Period;
  onSaved?: () => void;
  onDeleted?: () => void;
}

export function PeriodForm({
  existingPeriod,
  onSaved,
  onDeleted,
}: PeriodFormProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const textStart = useAlignStart();
  const coupleId = useAuthStore((state) => state.coupleId);
  const user = useAuthStore((state) => state.user);
  const {
    isEdit,
    gregorianDate,
    hebrewDate,
    onah,
    notes,
    isSaving,
    isDeleting,
    setGregorian,
    setHebrew,
    setOnah,
    setNotes,
    save,
    remove,
  } = usePeriodForm(existingPeriod);

  async function handleSave() {
    const ok = await save();
    if (ok && isEdit) {
      onSaved?.();
    }
  }

  function handlePreview() {
    if (!coupleId || !user) {
      return;
    }

    usePeriodDraftStore.getState().setDraft({
      dateGregorian: formatGregorianLocal(gregorianDate),
      dateHebrew: hebrewDate,
      onah,
      notes: notes.trim(),
    });
    router.push('/(app)/add-period-preview');
  }

  function handleDeletePress() {
    showAlert(t('period.deleteConfirmTitle'), t('period.deleteConfirmMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('period.delete'),
        style: 'destructive',
        onPress: () => {
          void (async () => {
            const ok = await remove();
            if (ok) {
              onDeleted?.();
            }
          })();
        },
      },
    ]);
  }

  const submitLabel = isEdit ? t('period.previewChanges') : t('period.previewNext');

  return (
    <View style={styles.form}>
      <SyncedDatePickers
        gregorianDate={gregorianDate}
        hebrewDate={hebrewDate}
        onGregorianChange={setGregorian}
        onHebrewChange={setHebrew}
      />

      <OnahPicker value={onah} onChange={setOnah} />

      <View style={styles.field}>
        <Text style={[styles.label, textStartStyle()]}>{t('period.notes')}</Text>
        <TextInput
          style={styles.input}
          value={notes}
          onChangeText={setNotes}
          multiline
          textAlignVertical="top"
          textAlign={textStart}
        />
      </View>

      <Pressable
        style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
        onPress={() => void (isEdit ? handleSave() : handlePreview())}
        disabled={isSaving || isDeleting}
      >
        {isSaving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>{submitLabel}</Text>
        )}
      </Pressable>

      {isEdit ? (
        <Pressable
          style={[styles.deleteButton, isDeleting && styles.saveButtonDisabled]}
          onPress={handleDeletePress}
          disabled={isSaving || isDeleting}
        >
          {isDeleting ? (
            <ActivityIndicator color="#b91c1c" />
          ) : (
            <Text style={styles.deleteButtonText}>{t('period.delete')}</Text>
          )}
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 24,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ccc',
    borderRadius: 10,
    minHeight: 88,
    padding: 12,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
  },
  deleteButtonText: {
    color: '#b91c1c',
    fontSize: 16,
    fontWeight: '600',
  },
});
