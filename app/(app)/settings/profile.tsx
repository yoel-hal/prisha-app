import { Stack, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { CountryPickerFieldHandle } from '../../../src/components/common/CountryPickerField';
import { ProfileFormFields } from '../../../src/components/settings/ProfileFormFields';
import {
  getUserDocument,
  saveUserProfile,
  updateUserCountryAndLanguage,
  type OnboardingLanguage,
} from '../../../src/firebase/firestore';
import { setAppLanguage, type SupportedLanguage } from '../../../src/i18n';
import { useAuthStore } from '../../../src/store/authStore';
import { textStartStyle } from '../../../src/utils/rtl';
import { webScreenScrollStyles } from '../../../src/utils/webScroll';

function isSupportedLanguage(value: string): value is SupportedLanguage {
  return value === 'he' || value === 'en';
}

export default function ProfileSettingsScreen() {
  const { t } = useTranslation();
  const webScroll = webScreenScrollStyles();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isPartnerMode = useAuthStore((state) => state.isPartnerMode);
  const setUserProfile = useAuthStore((state) => state.setUserProfile);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [country, setCountry] = useState('');
  const [phone, setPhone] = useState('');
  const [language, setLanguage] = useState<OnboardingLanguage>('en');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const firstNameRef = useRef<TextInput>(null);
  const lastNameRef = useRef<TextInput>(null);
  const countryPickerRef = useRef<CountryPickerFieldHandle>(null);
  const phoneRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void (async () => {
      const doc = await getUserDocument(user.uid);
      if (cancelled) {
        return;
      }

      if (doc) {
        setFirstName(doc.firstName);
        setLastName(doc.lastName);
        setCountry(doc.country);
        setPhone(doc.phone);
        if (isSupportedLanguage(doc.language)) {
          setLanguage(doc.language);
        }
      }

      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  async function handleSave() {
    if (!user?.uid || isPartnerMode) {
      return;
    }

    setSaving(true);
    try {
      await updateUserCountryAndLanguage(user.uid, country, language);
      await saveUserProfile(
        user.uid,
        { firstName, lastName, country, phone },
        user.email ?? undefined,
      );
      await setAppLanguage(language);
      setUserProfile({ firstName, lastName, country, phone });
      router.back();
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: t('settings.profile'),
          gestureEnabled: !saving,
          headerBackVisible: !saving,
        }}
      />
      <SafeAreaView style={[styles.safe, webScroll.safe]} edges={['bottom']}>
        <ScrollView
          style={[styles.scroll, webScroll.scroll]}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {isPartnerMode ? (
            <Text style={[styles.partnerNote, textStartStyle()]}>
              {t('partner.restrictedFeature')}
            </Text>
          ) : null}

          {loading ? (
            <ActivityIndicator style={styles.loader} />
          ) : (
            <>
              <Text style={[styles.sectionLabel, textStartStyle()]}>
                {t('settings.language')}
              </Text>
              <View style={styles.languageRow}>
                <LanguageButton
                  label="עברית"
                  active={language === 'he'}
                  onPress={() => setLanguage('he')}
                  disabled={saving || isPartnerMode}
                />
                <LanguageButton
                  label="English"
                  active={language === 'en'}
                  onPress={() => setLanguage('en')}
                  disabled={saving || isPartnerMode}
                />
              </View>

              <ProfileFormFields
                firstName={firstName}
                setFirstName={setFirstName}
                lastName={lastName}
                setLastName={setLastName}
                country={country}
                setCountry={setCountry}
                phone={phone}
                setPhone={setPhone}
                disabled={saving || isPartnerMode}
                firstNameRef={firstNameRef}
                lastNameRef={lastNameRef}
                countryPickerRef={countryPickerRef}
                phoneRef={phoneRef}
                onPhoneSubmitEditing={() => void handleSave()}
              />
            </>
          )}

          {!isPartnerMode ? (
            <Pressable
              style={({ pressed }) => [
                styles.saveButton,
                (saving || loading) && styles.saveDisabled,
                pressed && !saving && !loading && styles.savePressed,
              ]}
              onPress={() => void handleSave()}
              disabled={saving || loading}
              accessibilityRole="button"
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>{t('settings.saveConfirm')}</Text>
              )}
            </Pressable>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

function LanguageButton({
  label,
  active,
  onPress,
  disabled,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  disabled: boolean;
}) {
  return (
    <Pressable
      style={[styles.languageButton, active && styles.languageButtonActive]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text
        style={[
          styles.languageButtonText,
          active && styles.languageButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 32,
    gap: 24,
    flexGrow: 1,
  },
  loader: {
    marginTop: 24,
  },
  partnerNote: {
    fontSize: 15,
    color: '#3a5a9a',
    lineHeight: 22,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
    marginBottom: -12,
  },
  languageRow: {
    flexDirection: 'row',
    gap: 12,
  },
  languageButton: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  languageButtonActive: {
    backgroundColor: '#1a1a1a',
    borderColor: '#1a1a1a',
  },
  languageButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  languageButtonTextActive: {
    color: '#fff',
  },
  saveButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
    ...(Platform.OS === 'web'
      ? ({ cursor: 'pointer' } as const)
      : null),
  },
  savePressed: {
    opacity: 0.85,
  },
  saveDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
