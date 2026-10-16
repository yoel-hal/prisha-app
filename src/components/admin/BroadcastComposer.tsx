import { db, functions } from '@/firebase/config';
import {
  BROADCAST_MINHAGIM,
  type BroadcastChannels,
  type BroadcastTargetFilter,
  type BroadcastTargetType,
} from '@/types/broadcast';
import { textStartStyle } from '@/utils/rtl';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import {
  addDoc,
  collection,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

type ContentTab = 'he' | 'en';

function hasAnyChannel(channels: BroadcastChannels): boolean {
  return channels.push || channels.inApp || channels.email;
}

export function BroadcastComposer() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<ContentTab>('he');
  const [titleHe, setTitleHe] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [bodyHe, setBodyHe] = useState('');
  const [bodyEn, setBodyEn] = useState('');
  const [channels, setChannels] = useState<BroadcastChannels>({
    push: true,
    inApp: true,
    email: false,
  });
  const [targetType, setTargetType] = useState<BroadcastTargetType>('all');
  const [minhagValue, setMinhagValue] = useState(BROADCAST_MINHAGIM[0]);
  const [countryValue, setCountryValue] = useState('');
  const [sendNow, setSendNow] = useState(true);
  const [scheduledAt, setScheduledAt] = useState(
    () => new Date(Date.now() + 60 * 60 * 1000),
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const targetFilter = useMemo<BroadcastTargetFilter>(() => {
    if (targetType === 'byMinhag') {
      return { type: 'byMinhag', value: minhagValue };
    }
    if (targetType === 'byCountry') {
      return { type: 'byCountry', value: countryValue.trim() };
    }
    return { type: 'all' };
  }, [countryValue, minhagValue, targetType]);

  const canSend = useMemo(() => {
    const hasContent =
      titleHe.trim().length > 0 &&
      titleEn.trim().length > 0 &&
      bodyHe.trim().length > 0 &&
      bodyEn.trim().length > 0;
    const hasTarget =
      targetType === 'all' ||
      (targetType === 'byMinhag' && minhagValue.length > 0) ||
      (targetType === 'byCountry' && countryValue.trim().length > 0);

    return hasContent && hasTarget && hasAnyChannel(channels);
  }, [
    bodyEn,
    bodyHe,
    channels,
    countryValue,
    minhagValue,
    targetType,
    titleEn,
    titleHe,
  ]);

  const previewTitle = activeTab === 'he' ? titleHe : titleEn;
  const previewBody = activeTab === 'he' ? bodyHe : bodyEn;

  const toggleChannel = useCallback((key: keyof BroadcastChannels) => {
    setChannels((current) => ({ ...current, [key]: !current[key] }));
  }, []);

  const handleDateChange = useCallback(
    (_event: DateTimePickerEvent, selected?: Date) => {
      if (Platform.OS === 'android') {
        setShowDatePicker(false);
      }
      if (selected) {
        setScheduledAt(selected);
      }
    },
    [],
  );

  const handleSend = useCallback(async () => {
    if (!canSend || sending) {
      return;
    }

    setSending(true);
    setError(null);
    setSuccess(null);

    try {
      const scheduledTimestamp = sendNow
        ? null
        : Timestamp.fromDate(scheduledAt);

      const docRef = await addDoc(collection(db, 'broadcasts'), {
        titleHe: titleHe.trim(),
        titleEn: titleEn.trim(),
        bodyHe: bodyHe.trim(),
        bodyEn: bodyEn.trim(),
        channels,
        targetFilter,
        scheduledAt: scheduledTimestamp,
        sentAt: null,
        status: sendNow ? 'draft' : 'scheduled',
        recipientCount: 0,
        createdAt: serverTimestamp(),
      });

      if (sendNow) {
        const callable = httpsCallable<
          { broadcastId: string },
          { success: boolean; recipientCount: number }
        >(functions, 'broadcastMessage');
        const result = await callable({ broadcastId: docRef.id });
        setSuccess(
          `${t('admin.broadcast.send')} — ${result.data.recipientCount} ${t('admin.broadcast.recipients')}`,
        );
      } else {
        setSuccess(t('admin.broadcast.status.scheduled'));
      }

      setTitleHe('');
      setTitleEn('');
      setBodyHe('');
      setBodyEn('');
      setChannels({ push: true, inApp: true, email: false });
      setTargetType('all');
      setCountryValue('');
      setSendNow(true);
    } catch (sendError) {
      const message =
        sendError instanceof Error ? sendError.message : 'Failed to send broadcast';
      setError(message);
    } finally {
      setSending(false);
    }
  }, [
    bodyEn,
    bodyHe,
    canSend,
    channels,
    scheduledAt,
    sendNow,
    sending,
    t,
    targetFilter,
    titleEn,
    titleHe,
  ]);

  return (
    <View className="gap-4 rounded-xl border border-neutral-200 bg-white p-4">
      <Text
        className="text-lg font-semibold text-neutral-900"
        style={textStartStyle()}
      >
        {t('admin.broadcast.compose')}
      </Text>

      <View className="flex-row gap-2">
        {(['he', 'en'] as ContentTab[]).map((tab) => {
          const isActive = activeTab === tab;
          return (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`rounded-full px-4 py-2 ${
                isActive ? 'bg-neutral-900' : 'bg-neutral-100'
              }`}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
            >
              <Text
                className={`text-sm font-medium ${
                  isActive ? 'text-white' : 'text-neutral-700'
                }`}
              >
                {tab === 'he'
                  ? t('admin.broadcast.hebrew')
                  : t('admin.broadcast.english')}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View className="gap-3">
        <TextInput
          className="rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3 text-base text-neutral-900"
          value={activeTab === 'he' ? titleHe : titleEn}
          onChangeText={activeTab === 'he' ? setTitleHe : setTitleEn}
          placeholder={t('admin.broadcast.compose')}
          placeholderTextColor="#999"
          style={textStartStyle()}
        />
        <TextInput
          className="min-h-[120px] rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3 text-base text-neutral-900"
          value={activeTab === 'he' ? bodyHe : bodyEn}
          onChangeText={activeTab === 'he' ? setBodyHe : setBodyEn}
          placeholder={t('admin.broadcast.compose')}
          placeholderTextColor="#999"
          multiline
          textAlignVertical="top"
          style={textStartStyle()}
        />
      </View>

      <View className="gap-2">
        {(
          [
            ['push', 'admin.broadcast.channels.push'],
            ['inApp', 'admin.broadcast.channels.inApp'],
            ['email', 'admin.broadcast.channels.email'],
          ] as const
        ).map(([key, labelKey]) => (
          <Pressable
            key={key}
            onPress={() => toggleChannel(key)}
            className="flex-row items-center gap-3 py-1"
            accessibilityRole="checkbox"
            accessibilityState={{ checked: channels[key] }}
          >
            <View
              className={`h-5 w-5 items-center justify-center rounded border ${
                channels[key]
                  ? 'border-neutral-900 bg-neutral-900'
                  : 'border-neutral-400 bg-white'
              }`}
            >
              {channels[key] ? (
                <Text className="text-xs font-bold text-white">✓</Text>
              ) : null}
            </View>
            <Text className="text-sm text-neutral-800" style={textStartStyle()}>
              {t(labelKey)}
            </Text>
          </Pressable>
        ))}
      </View>

      <View className="gap-2">
        <Text className="text-sm font-medium text-neutral-700" style={textStartStyle()}>
          {t('admin.broadcast.targetLabel')}
        </Text>
        {(
          [
            ['all', 'admin.broadcast.target.all'],
            ['byMinhag', 'admin.broadcast.target.byMinhag'],
            ['byCountry', 'admin.broadcast.target.byCountry'],
          ] as const
        ).map(([type, labelKey]) => {
          const isActive = targetType === type;
          return (
            <Pressable
              key={type}
              onPress={() => setTargetType(type)}
              className="flex-row items-center gap-3 py-1"
              accessibilityRole="radio"
              accessibilityState={{ selected: isActive }}
            >
              <View
                className={`h-5 w-5 rounded-full border-2 ${
                  isActive ? 'border-neutral-900' : 'border-neutral-400'
                } items-center justify-center`}
              >
                {isActive ? (
                  <View className="h-2.5 w-2.5 rounded-full bg-neutral-900" />
                ) : null}
              </View>
              <Text className="text-sm text-neutral-800" style={textStartStyle()}>
                {t(labelKey)}
              </Text>
            </Pressable>
          );
        })}

        {targetType === 'byMinhag' ? (
          <View className="mt-1 flex-row flex-wrap gap-2">
            {BROADCAST_MINHAGIM.map((minhag) => {
              const isActive = minhagValue === minhag;
              return (
                <Pressable
                  key={minhag}
                  onPress={() => setMinhagValue(minhag)}
                  className={`rounded-full px-3 py-1.5 ${
                    isActive ? 'bg-neutral-900' : 'bg-neutral-100'
                  }`}
                  accessibilityRole="button"
                >
                  <Text
                    className={`text-sm ${
                      isActive ? 'font-semibold text-white' : 'text-neutral-700'
                    }`}
                  >
                    {t(`minhag.${minhag}`)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {targetType === 'byCountry' ? (
          <TextInput
            className="rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3 text-base text-neutral-900"
            value={countryValue}
            onChangeText={setCountryValue}
            placeholder="IL"
            autoCapitalize="characters"
            style={textStartStyle()}
          />
        ) : null}
      </View>

      <View className="gap-2">
        <Text className="text-sm font-medium text-neutral-700" style={textStartStyle()}>
          {t('admin.broadcast.scheduleLabel')}
        </Text>
        <View className="flex-row flex-wrap gap-2">
          <Pressable
            onPress={() => setSendNow(true)}
            className={`rounded-full px-3 py-1.5 ${
              sendNow ? 'bg-neutral-900' : 'bg-neutral-100'
            }`}
            accessibilityRole="radio"
            accessibilityState={{ selected: sendNow }}
          >
            <Text
              className={`text-sm ${
                sendNow ? 'font-semibold text-white' : 'text-neutral-700'
              }`}
            >
              {t('admin.broadcast.schedule.now')}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setSendNow(false)}
            className={`rounded-full px-3 py-1.5 ${
              !sendNow ? 'bg-neutral-900' : 'bg-neutral-100'
            }`}
            accessibilityRole="radio"
            accessibilityState={{ selected: !sendNow }}
          >
            <Text
              className={`text-sm ${
                !sendNow ? 'font-semibold text-white' : 'text-neutral-700'
              }`}
            >
              {t('admin.broadcast.schedule.later')}
            </Text>
          </Pressable>
        </View>

        {!sendNow ? (
          <View className="gap-2">
            {Platform.OS === 'web' ? (
              <TextInput
                className="rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3 text-base text-neutral-900"
                value={scheduledAt.toISOString().slice(0, 16)}
                onChangeText={(value) => {
                  const parsed = new Date(value);
                  if (!Number.isNaN(parsed.getTime())) {
                    setScheduledAt(parsed);
                  }
                }}
                placeholder="YYYY-MM-DDTHH:mm"
                style={textStartStyle()}
              />
            ) : (
              <>
                <Pressable
                  onPress={() => setShowDatePicker(true)}
                  className="rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3"
                  accessibilityRole="button"
                >
                  <Text className="text-base text-neutral-900" style={textStartStyle()}>
                    {scheduledAt.toLocaleString()}
                  </Text>
                </Pressable>
                {showDatePicker ? (
                  <DateTimePicker
                    value={scheduledAt}
                    mode="datetime"
                    onChange={handleDateChange}
                  />
                ) : null}
              </>
            )}
          </View>
        ) : null}
      </View>

      {error ? (
        <Text
          className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800"
          style={textStartStyle()}
        >
          {error}
        </Text>
      ) : null}

      {success ? (
        <Text
          className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800"
          style={textStartStyle()}
        >
          {success}
        </Text>
      ) : null}

      <View className="flex-row flex-wrap gap-3">
        <Pressable
          onPress={() => setPreviewOpen(true)}
          className="min-h-[48px] flex-1 items-center justify-center rounded-xl border border-neutral-300 py-3"
          accessibilityRole="button"
        >
          <Text className="text-base font-semibold text-neutral-800">
            {t('admin.broadcast.preview')}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => void handleSend()}
          disabled={!canSend || sending}
          className={`min-h-[48px] flex-1 items-center justify-center rounded-xl bg-neutral-900 py-3 ${
            canSend && !sending ? '' : 'opacity-60'
          }`}
          accessibilityRole="button"
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className="text-base font-semibold text-white">
              {t('admin.broadcast.send')}
            </Text>
          )}
        </Pressable>
      </View>

      <Modal
        visible={previewOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewOpen(false)}
      >
        <Pressable
          className="flex-1 items-center justify-center bg-black/50 p-6"
          onPress={() => setPreviewOpen(false)}
        >
          <Pressable
            className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-lg"
            onPress={(event) => event.stopPropagation()}
          >
            <View className="mb-3 rounded-xl bg-neutral-900 px-4 py-3">
              <Text
                className="text-base font-bold text-white"
                style={textStartStyle()}
              >
                {previewTitle || '—'}
              </Text>
            </View>
            <ScrollView className="max-h-64">
              <Text className="text-base text-neutral-800" style={textStartStyle()}>
                {previewBody || '—'}
              </Text>
            </ScrollView>
            <Pressable
              onPress={() => setPreviewOpen(false)}
              className="mt-4 items-center rounded-xl bg-neutral-100 py-3"
              accessibilityRole="button"
            >
              <Text className="text-sm font-semibold text-neutral-800">
                {t('common.cancel')}
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
