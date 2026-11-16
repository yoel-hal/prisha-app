import { Stack } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { hefsekMinDays } from '../../../src/calculations/tahara';
import type { HefsekMinDays, TaharaSettings } from '../../../src/calculations/types';
import { AppSwitch } from '../../../src/components/common/AppSwitch';
import { colors, radius } from '../../../src/constants/theme';
import { useDesktopWeb } from '../../../src/hooks/useDesktopWeb';
import { useNotifications } from '../../../src/hooks/useNotifications';
import { useSettingsSaved } from '../../../src/hooks/useSettingsSaved';
import { useTahara } from '../../../src/hooks/useTahara';
import { useSettingsStore } from '../../../src/store/settingsStore';
import { textStartStyle } from '../../../src/utils/rtl';
import { webScreenScrollStyles } from '../../../src/utils/webScroll';

const MIN_DAY_OPTIONS: (HefsekMinDays | null)[] = [null, 4, 5];

/** Hefsek tahara and the seven clean days: optional card and optional reminders. Saves on change. */
export default function TaharaSettingsScreen() {
  const { t } = useTranslation();
  const isDesktopWeb = useDesktopWeb();
  const webScroll = webScreenScrollStyles();
  const isWeb = Platform.OS === 'web';
  const minhag = useSettingsStore((state) => state.minhag);
  const { settings, saveSettings } = useTahara();
  const { requestPermission } = useNotifications();
  const settingsSaved = useSettingsSaved();
  const [permissionDenied, setPermissionDenied] = useState(false);

  async function update(next: TaharaSettings) {
    await saveSettings(next);
    settingsSaved();
  }

  async function toggleReminders(enabled: boolean) {
    setPermissionDenied(false);
    if (enabled && !(await requestPermission())) {
      setPermissionDenied(true);
      return;
    }
    await update({ ...settings, remindersEnabled: enabled });
  }

  const optionLabel = (option: HefsekMinDays | null) =>
    option === null
      ? t('taharaSettings.byMinhag', { days: hefsekMinDays(minhag, null) })
      : t(option === 4 ? 'taharaSettings.day4' : 'taharaSettings.day5');

  const body = (
    <ScrollView style={webScroll.scroll} contentContainerStyle={styles.scroll}>
      <Text style={[styles.description, textStartStyle()]}>{t('taharaSettings.description')}</Text>

      <View style={styles.row}>
        <Text style={[styles.rowLabel, textStartStyle()]}>{t('taharaSettings.show')}</Text>
        <AppSwitch
          value={settings.enabled}
          onValueChange={(enabled) => void update({ ...settings, enabled })}
        />
      </View>

      <View style={[styles.group, !settings.enabled && styles.off]}>
        <Text style={[styles.sectionLabel, textStartStyle()]}>{t('taharaSettings.minDays')}</Text>
        <View style={styles.segmentRow}>
          {MIN_DAY_OPTIONS.map((option) => {
            const selected = settings.minDaysOverride === option;
            return (
              <Pressable
                key={String(option)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                disabled={!settings.enabled}
                onPress={() => void update({ ...settings, minDaysOverride: option })}
                style={[styles.segment, option === null && styles.segmentWide, selected && styles.segmentSelected]}
              >
                <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>
                  {optionLabel(option)}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={[styles.hint, textStartStyle()]}>{t('taharaSettings.minDaysHint')}</Text>

        <View style={[styles.row, styles.rowSpaced]}>
          <Text style={[styles.rowLabel, textStartStyle()]}>{t('taharaSettings.reminders')}</Text>
          <AppSwitch
            value={!isWeb && settings.remindersEnabled}
            onValueChange={(enabled) => void toggleReminders(enabled)}
            disabled={isWeb || !settings.enabled}
          />
        </View>
        <Text style={[styles.hint, textStartStyle()]}>
          {isWeb ? t('taharaSettings.remindersWeb') : t('taharaSettings.remindersHint')}
        </Text>
        {permissionDenied ? (
          <Text style={[styles.hint, styles.error, textStartStyle()]}>
            {t('taharaSettings.remindersNeedPermission')}
          </Text>
        ) : null}
      </View>

      <Text style={[styles.hint, styles.partner, textStartStyle()]}>{t('taharaSettings.partnerNote')}</Text>
    </ScrollView>
  );

  if (isDesktopWeb) {
    return <View style={styles.safe}>{body}</View>;
  }

  return (
    <>
      <Stack.Screen options={{ title: t('taharaSettings.title') }} />
      <SafeAreaView style={[styles.safe, webScroll.safe]} edges={['bottom']}>
        {body}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.page },
  scroll: { padding: 20, paddingBottom: 32, gap: 8 },
  description: { fontSize: 15, lineHeight: 22, color: colors.textSecondary, marginBottom: 8 },
  group: { gap: 8 },
  off: { opacity: 0.4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairline,
  },
  rowSpaced: { marginTop: 16 },
  rowLabel: { flex: 1, fontSize: 16, color: colors.text, fontWeight: '500', paddingEnd: 12 },
  sectionLabel: { fontSize: 14, color: colors.textMuted, fontWeight: '500', marginTop: 16 },
  segmentRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  segment: {
    flex: 1,
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: radius.control,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairlineStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentWide: { flex: 2 },
  segmentSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  segmentText: { fontSize: 14, color: colors.text, fontWeight: '500' },
  segmentTextSelected: { color: colors.onAccent },
  hint: { fontSize: 14, lineHeight: 20, color: colors.textMuted },
  error: { color: colors.negative },
  partner: { marginTop: 16 },
});
