import { db } from '@/firebase/config';
import type { AppMessage } from '@/types';
import { log } from '@/utils/log';
import { textStartStyle } from '@/utils/rtl';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import {
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';

type ContentTab = 'he' | 'en';

export interface BannerEditorPreviewState {
  titleHe: string;
  titleEn: string;
  bodyHe: string;
  bodyEn: string;
  ctaTextHe: string;
  ctaTextEn: string;
  ctaUrl: string;
  activeTab: ContentTab;
  isActive: boolean;
}

interface BannerEditorProps {
  onPreviewChange?: (state: BannerEditorPreviewState) => void;
}

function mapLoadedMessage(data: Record<string, unknown>): Partial<AppMessage> | null {
  const createdAt = data.createdAt;
  if (
    !createdAt ||
    typeof createdAt !== 'object' ||
    !('toMillis' in createdAt)
  ) {
    return null;
  }

  const activeFrom = data.activeFrom;
  const activeUntil = data.activeUntil;
  if (
    !activeFrom ||
    typeof activeFrom !== 'object' ||
    !('toMillis' in activeFrom) ||
    !activeUntil ||
    typeof activeUntil !== 'object' ||
    !('toMillis' in activeUntil)
  ) {
    return null;
  }

  return {
    titleHe: typeof data.titleHe === 'string' ? data.titleHe : '',
    titleEn: typeof data.titleEn === 'string' ? data.titleEn : '',
    bodyHe: typeof data.bodyHe === 'string' ? data.bodyHe : '',
    bodyEn: typeof data.bodyEn === 'string' ? data.bodyEn : '',
    ctaTextHe: typeof data.ctaTextHe === 'string' ? data.ctaTextHe : null,
    ctaTextEn: typeof data.ctaTextEn === 'string' ? data.ctaTextEn : null,
    ctaUrl: typeof data.ctaUrl === 'string' ? data.ctaUrl : null,
    activeFrom: activeFrom as Timestamp,
    activeUntil: activeUntil as Timestamp,
    isActive: data.isActive === true,
    createdAt: createdAt as Timestamp,
  };
}

function defaultActiveUntil(): Date {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date;
}

export function BannerEditor({ onPreviewChange }: BannerEditorProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<ContentTab>('he');
  const [titleHe, setTitleHe] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [bodyHe, setBodyHe] = useState('');
  const [bodyEn, setBodyEn] = useState('');
  const [ctaTextHe, setCtaTextHe] = useState('');
  const [ctaTextEn, setCtaTextEn] = useState('');
  const [ctaUrl, setCtaUrl] = useState('');
  const [activeFrom, setActiveFrom] = useState(() => new Date());
  const [activeUntil, setActiveUntil] = useState(defaultActiveUntil);
  const [isActive, setIsActive] = useState(true);
  const [existingCreatedAt, setExistingCreatedAt] = useState<Timestamp | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showActiveFromPicker, setShowActiveFromPicker] = useState(false);
  const [showActiveUntilPicker, setShowActiveUntilPicker] = useState(false);

  useEffect(() => {
    log('[BannerEditor] enter');

    const bannerRef = doc(db, 'appMessages', 'active');
    const unsubscribe = onSnapshot(
      bannerRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setLoading(false);
          return;
        }

        const mapped = mapLoadedMessage(snapshot.data());
        if (!mapped) {
          setLoading(false);
          return;
        }

        setTitleHe(mapped.titleHe ?? '');
        setTitleEn(mapped.titleEn ?? '');
        setBodyHe(mapped.bodyHe ?? '');
        setBodyEn(mapped.bodyEn ?? '');
        setCtaTextHe(mapped.ctaTextHe ?? '');
        setCtaTextEn(mapped.ctaTextEn ?? '');
        setCtaUrl(mapped.ctaUrl ?? '');
        setActiveFrom(mapped.activeFrom?.toDate() ?? new Date());
        setActiveUntil(mapped.activeUntil?.toDate() ?? defaultActiveUntil());
        setIsActive(mapped.isActive ?? false);
        setExistingCreatedAt(mapped.createdAt ?? null);
        setLoading(false);
      },
      (snapshotError) => {
        log('[BannerEditor] snapshot error', snapshotError);
        setError(snapshotError.message);
        setLoading(false);
      },
    );

    return () => {
      log('[BannerEditor] exit');
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    onPreviewChange?.({
      titleHe,
      titleEn,
      bodyHe,
      bodyEn,
      ctaTextHe,
      ctaTextEn,
      ctaUrl,
      activeTab,
      isActive,
    });
  }, [
    activeTab,
    bodyEn,
    bodyHe,
    ctaTextEn,
    ctaTextHe,
    ctaUrl,
    isActive,
    onPreviewChange,
    titleEn,
    titleHe,
  ]);

  const canSave = useMemo(
    () =>
      titleHe.trim().length > 0 &&
      titleEn.trim().length > 0 &&
      bodyHe.trim().length > 0 &&
      bodyEn.trim().length > 0 &&
      activeUntil.getTime() > activeFrom.getTime(),
    [activeFrom, activeUntil, bodyEn, bodyHe, titleEn, titleHe],
  );

  const previewTitle = activeTab === 'he' ? titleHe : titleEn;
  const previewBody = activeTab === 'he' ? bodyHe : bodyEn;
  const previewCta = activeTab === 'he' ? ctaTextHe : ctaTextEn;

  const handleDateChange = useCallback(
    (
      field: 'activeFrom' | 'activeUntil',
      _event: DateTimePickerEvent,
      selected?: Date,
    ) => {
      if (Platform.OS === 'android') {
        setShowActiveFromPicker(false);
        setShowActiveUntilPicker(false);
      }
      if (!selected) {
        return;
      }
      if (field === 'activeFrom') {
        setActiveFrom(selected);
      } else {
        setActiveUntil(selected);
      }
    },
    [],
  );

  const handleSave = useCallback(async () => {
    if (!canSave || saving) {
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    const payload = {
      titleHe: titleHe.trim(),
      titleEn: titleEn.trim(),
      bodyHe: bodyHe.trim(),
      bodyEn: bodyEn.trim(),
      ctaTextHe: ctaTextHe.trim() || null,
      ctaTextEn: ctaTextEn.trim() || null,
      ctaUrl: ctaUrl.trim() || null,
      activeFrom: Timestamp.fromDate(activeFrom),
      activeUntil: Timestamp.fromDate(activeUntil),
      isActive,
      ...(existingCreatedAt
        ? { createdAt: existingCreatedAt }
        : { createdAt: serverTimestamp() }),
    };

    try {
      const bannerRef = doc(db, 'appMessages', 'active');
      if (existingCreatedAt) {
        await updateDoc(bannerRef, payload);
      } else {
        await setDoc(bannerRef, payload);
      }
      setSuccess(t('admin.banner.save'));
    } catch (saveError) {
      const message =
        saveError instanceof Error ? saveError.message : 'Failed to save banner';
      setError(message);
    } finally {
      setSaving(false);
    }
  }, [
    activeFrom,
    activeUntil,
    bodyEn,
    bodyHe,
    canSave,
    ctaTextEn,
    ctaTextHe,
    ctaUrl,
    existingCreatedAt,
    isActive,
    saving,
    t,
    titleEn,
    titleHe,
  ]);

  const handleClear = useCallback(async () => {
    if (saving) {
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      if (existingCreatedAt) {
        const bannerRef = doc(db, 'appMessages', 'active');
        await updateDoc(bannerRef, { isActive: false });
      }
      setIsActive(false);
      setSuccess(t('admin.banner.clear'));
    } catch (clearError) {
      const message =
        clearError instanceof Error ? clearError.message : 'Failed to clear banner';
      setError(message);
    } finally {
      setSaving(false);
    }
  }, [existingCreatedAt, saving, t]);

  const renderDateField = (
    label: string,
    value: Date,
    field: 'activeFrom' | 'activeUntil',
    showPicker: boolean,
    setShowPicker: (show: boolean) => void,
  ) => (
    <View className="gap-2">
      <Text className="text-sm font-medium text-neutral-700" style={textStartStyle()}>
        {label}
      </Text>
      {Platform.OS === 'web' ? (
        <TextInput
          className="rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3 text-base text-neutral-900"
          value={value.toISOString().slice(0, 16)}
          onChangeText={(text) => {
            const parsed = new Date(text);
            if (!Number.isNaN(parsed.getTime())) {
              if (field === 'activeFrom') {
                setActiveFrom(parsed);
              } else {
                setActiveUntil(parsed);
              }
            }
          }}
          placeholder="YYYY-MM-DDTHH:mm"
          style={textStartStyle()}
        />
      ) : (
        <>
          <Pressable
            onPress={() => setShowPicker(true)}
            className="rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3"
            accessibilityRole="button"
          >
            <Text className="text-base text-neutral-900" style={textStartStyle()}>
              {value.toLocaleString()}
            </Text>
          </Pressable>
          {showPicker ? (
            <DateTimePicker
              value={value}
              mode="datetime"
              onChange={(event, selected) =>
                handleDateChange(field, event, selected)
              }
            />
          ) : null}
        </>
      )}
    </View>
  );

  if (loading) {
    return (
      <View className="items-center rounded-xl border border-neutral-200 bg-white p-8">
        <ActivityIndicator size="large" color="#171717" />
      </View>
    );
  }

  return (
    <View className="gap-4 rounded-xl border border-neutral-200 bg-white p-4">
      <Text
        className="text-lg font-semibold text-neutral-900"
        style={textStartStyle()}
      >
        {t('admin.banner.editor')}
      </Text>

      <View className="flex-row gap-2">
        {(['he', 'en'] as ContentTab[]).map((tab) => {
          const tabActive = activeTab === tab;
          return (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`rounded-full px-4 py-2 ${
                tabActive ? 'bg-neutral-900' : 'bg-neutral-100'
              }`}
              accessibilityRole="button"
              accessibilityState={{ selected: tabActive }}
            >
              <Text
                className={`text-sm font-medium ${
                  tabActive ? 'text-white' : 'text-neutral-700'
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
          className="min-h-[100px] rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3 text-base text-neutral-900"
          value={activeTab === 'he' ? bodyHe : bodyEn}
          onChangeText={activeTab === 'he' ? setBodyHe : setBodyEn}
          placeholder={t('admin.broadcast.compose')}
          placeholderTextColor="#999"
          multiline
          textAlignVertical="top"
          style={textStartStyle()}
        />
      </View>

      <View className="gap-3">
        <Text className="text-sm font-medium text-neutral-700" style={textStartStyle()}>
          {t('admin.banner.cta')}
        </Text>
        <TextInput
          className="rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3 text-base text-neutral-900"
          value={activeTab === 'he' ? ctaTextHe : ctaTextEn}
          onChangeText={activeTab === 'he' ? setCtaTextHe : setCtaTextEn}
          placeholder={t('admin.banner.cta')}
          placeholderTextColor="#999"
          style={textStartStyle()}
        />
        <TextInput
          className="rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3 text-base text-neutral-900"
          value={ctaUrl}
          onChangeText={setCtaUrl}
          placeholder={t('admin.banner.ctaUrl')}
          placeholderTextColor="#999"
          autoCapitalize="none"
          keyboardType="url"
          style={textStartStyle()}
        />
      </View>

      <View className="gap-3">
        {renderDateField(
          t('admin.banner.activeFrom'),
          activeFrom,
          'activeFrom',
          showActiveFromPicker,
          setShowActiveFromPicker,
        )}
        {renderDateField(
          t('admin.banner.activeUntil'),
          activeUntil,
          'activeUntil',
          showActiveUntilPicker,
          setShowActiveUntilPicker,
        )}
      </View>

      <Pressable
        onPress={() => setIsActive((current) => !current)}
        className="flex-row items-center gap-3 py-1"
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isActive }}
      >
        <View
          className={`h-5 w-5 items-center justify-center rounded border ${
            isActive ? 'border-neutral-900 bg-neutral-900' : 'border-neutral-400 bg-white'
          }`}
        >
          {isActive ? (
            <Text className="text-xs font-bold text-white">✓</Text>
          ) : null}
        </View>
        <Text className="text-sm text-neutral-800" style={textStartStyle()}>
          {t('admin.banner.isActive')}
        </Text>
      </Pressable>

      <View className="gap-2 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-4">
        <Text className="text-sm font-medium text-neutral-600" style={textStartStyle()}>
          {t('admin.banner.preview')}
        </Text>
        <View className="rounded-xl bg-white p-3">
          <Text
            className="text-base font-bold text-neutral-900"
            style={textStartStyle()}
          >
            {previewTitle || '—'}
          </Text>
          <Text className="mt-1 text-sm text-neutral-700" style={textStartStyle()}>
            {previewBody || '—'}
          </Text>
          {previewCta.trim() && ctaUrl.trim() ? (
            <View className="mt-3 self-start rounded-lg bg-neutral-900 px-3 py-2">
              <Text className="text-sm font-semibold text-white">
                {previewCta.trim()}
              </Text>
            </View>
          ) : null}
        </View>
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
          onPress={() => void handleClear()}
          disabled={saving}
          className={`min-h-[48px] flex-1 items-center justify-center rounded-xl border border-neutral-300 py-3 ${
            saving ? 'opacity-60' : ''
          }`}
          accessibilityRole="button"
        >
          <Text className="text-base font-semibold text-neutral-800">
            {t('admin.banner.clear')}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => void handleSave()}
          disabled={!canSave || saving}
          className={`min-h-[48px] flex-1 items-center justify-center rounded-xl bg-neutral-900 py-3 ${
            canSave && !saving ? '' : 'opacity-60'
          }`}
          accessibilityRole="button"
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className="text-base font-semibold text-white">
              {t('admin.banner.save')}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
