import { Stack } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type {
  NotificationLeadHours,
  NotificationSettings,
  VesetType,
} from '../../../src/calculations/types';
import { useNotifications } from '../../../src/hooks/useNotifications';
import { useVesetCalculations } from '../../../src/hooks/useVesetCalculations';
import { useAuthStore } from '../../../src/store/authStore';
import { useSettingsStore } from '../../../src/store/settingsStore';
import { textStartStyle } from '../../../src/utils/rtl';
import { webScreenScrollStyles } from '../../../src/utils/webScroll';

const LEAD_OPTIONS: NotificationLeadHours[] = [12, 24, 48];

const TYPE_TOGGLES: { key: VesetType; labelKey: string }[] = [
  { key: 'onahBeinonit', labelKey: 'notifications.onahBeinonit' },
  { key: 'haflaga', labelKey: 'notifications.haflaga' },
  { key: 'yomHaChodesh', labelKey: 'notifications.yomHaChodesh' },
];

function leadHoursLabelKey(hours: NotificationLeadHours): string {
  if (hours === 12) {
    return 'notifications.hours12';
  }
  if (hours === 48) {
    return 'notifications.hours48';
  }
  return 'notifications.hours24';
}

export default function NotificationsSettingsScreen() {
  const webScroll = webScreenScrollStyles();
  const { t } = useTranslation();
  const coupleId = useAuthStore((state) => state.coupleId);
  const stored = useSettingsStore((state) => state.notifications);
  const setNotifications = useSettingsStore((state) => state.setNotifications);
  const saveSettings = useSettingsStore((state) => state.saveSettings);
  const { vesetim } = useVesetCalculations();
  const {
    requestPermission,
    scheduleAllVesetNotifications,
    cancelAllVesetNotifications,
  } = useNotifications();

  const [draft, setDraft] = useState<NotificationSettings>(stored);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    setDraft(stored);
  }, [stored]);

  const handleMasterToggle = useCallback(
    async (enabled: boolean) => {
      setDraft((prev) => ({ ...prev, enabled }));
      setPermissionDenied(false);

      if (!enabled) {
        await cancelAllVesetNotifications();
        return;
      }

      const granted = await requestPermission();
      if (!granted) {
        setPermissionDenied(true);
        setDraft((prev) => ({ ...prev, enabled: false }));
        return;
      }

      await scheduleAllVesetNotifications(vesetim, draft.leadHours, draft);
    },
    [
      cancelAllVesetNotifications,
      draft,
      requestPermission,
      scheduleAllVesetNotifications,
      vesetim,
    ],
  );

  const handleSave = useCallback(async () => {
    if (!coupleId) {
      return;
    }

    setSaving(true);
    setNotifications(draft);
    await saveSettings(coupleId);

    if (draft.enabled) {
      const granted = await requestPermission();
      if (granted) {
        await scheduleAllVesetNotifications(vesetim, draft.leadHours, draft);
      }
    } else {
      await cancelAllVesetNotifications();
    }

    setSaving(false);
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2500);
  }, [
    coupleId,
    draft,
    saveSettings,
    setNotifications,
    requestPermission,
    scheduleAllVesetNotifications,
    cancelAllVesetNotifications,
    vesetim,
  ]);

  return (
    <>
      <Stack.Screen options={{ title: t('notifications.title') }} />
      <SafeAreaView style={[styles.safe, webScroll.safe]} edges={['bottom']}>
        <ScrollView style={webScroll.scroll} contentContainerStyle={styles.scroll}>
          <SettingsRow
            label={t('notifications.enable')}
            value={draft.enabled}
            onValueChange={(value) => void handleMasterToggle(value)}
          />

          {permissionDenied ? (
            <Text style={[styles.hint, styles.error, textStartStyle()]}>
              {t('notifications.permissionDenied')}
            </Text>
          ) : null}

          <Text style={[styles.sectionLabel, textStartStyle()]}>
            {t('notifications.leadTime')}
          </Text>
          <View style={styles.segmentRow}>
            {LEAD_OPTIONS.map((hours) => (
              <Pressable
                key={hours}
                style={[
                  styles.segment,
                  draft.leadHours === hours && styles.segmentSelected,
                ]}
                onPress={() => setDraft((prev) => ({ ...prev, leadHours: hours }))}
              >
                <Text
                  style={[
                    styles.segmentText,
                    draft.leadHours === hours && styles.segmentTextSelected,
                  ]}
                >
                  {t(leadHoursLabelKey(hours))}
                </Text>
              </Pressable>
            ))}
          </View>

          {TYPE_TOGGLES.map((row) => (
            <SettingsRow
              key={row.key}
              label={t(row.labelKey)}
              value={draft[row.key]}
              onValueChange={(value) =>
                setDraft((prev) => ({ ...prev, [row.key]: value }))
              }
            />
          ))}
        </ScrollView>

        <View style={styles.footer}>
          {savedMessage ? (
            <Text style={[styles.saved, textStartStyle()]}>
              {t('notifications.saved')}
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

function SettingsRow({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, textStartStyle()]}>{label}</Text>
      <Switch value={value} onValueChange={onValueChange} />
    </View>
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
  segmentRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  segment: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  segmentSelected: {
    backgroundColor: '#1a1a1a',
    borderColor: '#1a1a1a',
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  segmentTextSelected: {
    color: '#fff',
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
