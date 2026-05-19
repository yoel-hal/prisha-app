import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OnahPicker } from '../../src/components/period/OnahPicker';
import { SyncedDatePickers } from '../../src/components/period/SyncedDatePickers';
import { WebMainContent } from '../../src/components/web/WebMainContent';
import type { VesetType } from '../../src/calculations/types';
import { DESKTOP_ADD_PERIOD_MAX_WIDTH } from '../../src/constants/layout';
import { useAddPeriod } from '../../src/hooks/useAddPeriod';
import { useDesktopWeb } from '../../src/hooks/useDesktopWeb';
import type { SupportedLanguage } from '../../src/i18n';
import { formatHebrewDate } from '../../src/utils/hebrewDateFormat';
import { useAlignStart, textStartStyle } from '../../src/utils/rtl';
import { webScreenScrollStyles } from '../../src/utils/webScroll';

function vesetKey(type: VesetType): string {
  return `veset.${type}`;
}

export default function AddPeriodScreen() {
  const { t, i18n } = useTranslation();
  const textStart = useAlignStart();
  const isDesktopWeb = useDesktopWeb();
  const webScroll = webScreenScrollStyles();
  const language = i18n.language as SupportedLanguage;
  const {
    gregorianDate,
    hebrewDate,
    onah,
    notes,
    isSaving,
    confirmationVesetim,
    setGregorian,
    setHebrew,
    setOnah,
    setNotes,
    save,
    clearConfirmation,
  } = useAddPeriod();

  async function handleSave() {
    await save();
  }

  const form = (
    <>
      <Text style={[styles.title, textStartStyle()]}>{t('period.add')}</Text>

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
        onPress={() => void handleSave()}
        disabled={isSaving}
      >
        {isSaving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>{t('period.save')}</Text>
        )}
      </Pressable>

      {confirmationVesetim ? (
        <View style={styles.confirmation}>
          <Text style={[styles.confirmationTitle, textStartStyle()]}>
            {t('period.saved')}
          </Text>
          <Text style={[styles.confirmationSubtitle, textStartStyle()]}>
            {t('period.confirmation')}
          </Text>
          {confirmationVesetim.map((veset) => (
            <View key={veset.id} style={styles.vesetRow}>
              <Text style={[styles.vesetType, textStartStyle()]}>
                {t(vesetKey(veset.type))}
              </Text>
              <Text style={[styles.vesetDate, textStartStyle()]}>
                {formatHebrewDate(veset.dateHebrew, language)} ·{' '}
                {t(veset.onah === 'day' ? 'period.day' : 'period.night')}
              </Text>
            </View>
          ))}
          <Pressable onPress={clearConfirmation}>
            <Text style={styles.dismiss}>{t('common.done')}</Text>
          </Pressable>
        </View>
      ) : null}
    </>
  );

  if (isDesktopWeb) {
    return (
      <WebMainContent centered maxWidth={DESKTOP_ADD_PERIOD_MAX_WIDTH}>
        <View style={styles.desktopCard}>{form}</View>
      </WebMainContent>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, webScroll.safe]} edges={['top']}>
      <ScrollView
        style={webScroll.scroll}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {form}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scroll: {
    padding: 20,
    gap: 24,
    paddingBottom: 40,
  },
  desktopCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e5e5',
    padding: 32,
    gap: 24,
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
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
  confirmation: {
    marginTop: 8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    gap: 8,
  },
  confirmationTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  confirmationSubtitle: {
    fontSize: 15,
    color: '#444',
  },
  vesetRow: {
    gap: 2,
    paddingTop: 4,
  },
  vesetType: {
    fontSize: 16,
    fontWeight: '600',
  },
  vesetDate: {
    fontSize: 14,
    color: '#555',
  },
  dismiss: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
  },
});
