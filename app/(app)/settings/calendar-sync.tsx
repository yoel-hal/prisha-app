import { Stack } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { CalendarSettings } from '../../../src/calculations/types';
import { useCalendarSync } from '../../../src/hooks/useCalendarSync';
import { useVesetCalculations } from '../../../src/hooks/useVesetCalculations';
import { useAuthStore } from '../../../src/store/authStore';
import {
  DEFAULT_CALENDAR_SETTINGS,
  useSettingsStore,
} from '../../../src/store/settingsStore';
import { alignStart, textStartStyle } from '../../../src/utils/rtl';
import { webScreenScrollStyles } from '../../../src/utils/webScroll';

export default function CalendarSyncSettingsScreen() {
  const webScroll = webScreenScrollStyles();
  const { t } = useTranslation();
  const coupleId = useAuthStore((state) => state.coupleId);
  const stored = useSettingsStore((state) => state.calendar);
  const setCalendar = useSettingsStore((state) => state.setCalendar);
  const saveSettings = useSettingsStore((state) => state.saveSettings);
  const { vesetim } = useVesetCalculations();
  const {
    requestCalendarPermission,
    syncAllVesetsToCalendar,
    removeAllSyncedEvents,
  } = useCalendarSync();

  const [draft, setDraft] = useState<CalendarSettings>(stored);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    setDraft(stored);
  }, [stored]);

  const handleSyncToggle = useCallback(
    async (syncEnabled: boolean) => {
      setDraft((prev) => ({ ...prev, syncEnabled }));
      setPermissionDenied(false);

      if (!syncEnabled) {
        await removeAllSyncedEvents();
        return;
      }

      const granted = await requestCalendarPermission();
      if (!granted) {
        setPermissionDenied(true);
        setDraft((prev) => ({ ...prev, syncEnabled: false }));
        return;
      }

      await syncAllVesetsToCalendar(vesetim, draft.eventTitle);
    },
    [
      draft.eventTitle,
      removeAllSyncedEvents,
      requestCalendarPermission,
      syncAllVesetsToCalendar,
      vesetim,
    ],
  );

  const handleSave = useCallback(async () => {
    if (!coupleId) {
      return;
    }

    setSaving(true);
    setCalendar(draft);
    await saveSettings(coupleId);

    if (draft.syncEnabled) {
      const granted = await requestCalendarPermission();
      if (granted) {
        await syncAllVesetsToCalendar(vesetim, draft.eventTitle);
      }
    }

    setSaving(false);
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2500);
  }, [
    coupleId,
    draft,
    requestCalendarPermission,
    saveSettings,
    setCalendar,
    syncAllVesetsToCalendar,
    vesetim,
  ]);

  const previewTitle =
    draft.eventTitle.trim() || DEFAULT_CALENDAR_SETTINGS.eventTitle;

  return (
    <>
      <Stack.Screen options={{ title: t('calendar.syncTitle') }} />
      <SafeAreaView style={[styles.safe, webScroll.safe]} edges={['bottom']}>
        <ScrollView style={webScroll.scroll} contentContainerStyle={styles.scroll}>
          <View style={styles.row}>
            <Text style={[styles.rowLabel, textStartStyle()]}>
              {t('calendar.syncEnable')}
            </Text>
            <Switch
              value={draft.syncEnabled}
              onValueChange={(value) => void handleSyncToggle(value)}
            />
          </View>

          {permissionDenied ? (
            <Text style={[styles.hint, styles.error, textStartStyle()]}>
              {t('calendar.permissionDenied')}
            </Text>
          ) : null}

          <Text style={[styles.sectionLabel, textStartStyle()]}>
            {t('calendar.eventTitle')}
          </Text>
          <TextInput
            style={[styles.input, textStartStyle()]}
            value={draft.eventTitle}
            onChangeText={(eventTitle) =>
              setDraft((prev) => ({ ...prev, eventTitle }))
            }
            placeholder={t('calendar.eventTitlePlaceholder')}
            textAlign={alignStart()}
          />

          <Text style={[styles.sectionLabel, textStartStyle()]}>
            {t('calendar.preview')}
          </Text>
          <View style={styles.previewCard}>
            <Text style={[styles.previewTitle, textStartStyle()]}>
              {previewTitle}
            </Text>
            <Text style={[styles.previewMeta, textStartStyle()]}>
              {t('calendar.previewAllDay')}
            </Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          {savedMessage ? (
            <Text style={[styles.saved, textStartStyle()]}>
              {t('calendar.syncSaved')}
            </Text>
          ) : null}
          <Pressable
            style={[styles.saveButton, saving && styles.saveDisabled]}
            onPress={() => void handleSave()}
            disabled={saving}
          >
            <Text style={styles.saveText}>{t('period.save')}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scroll: {
    padding: 20,
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  rowLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    paddingEnd: 12,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  previewCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    gap: 6,
    backgroundColor: '#fafafa',
  },
  previewTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  previewMeta: {
    fontSize: 14,
    color: '#666',
  },
  hint: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  error: {
    color: '#c62828',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#eee',
    gap: 8,
  },
  saved: {
    fontSize: 14,
    color: '#2e7d32',
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveDisabled: {
    opacity: 0.6,
  },
  saveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
