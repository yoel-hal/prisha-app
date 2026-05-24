import { Stack, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProfileFormFields } from '../../../src/components/settings/ProfileFormFields';
import { useProfileForm } from '../../../src/hooks/useProfileForm';
import { webScreenScrollStyles } from '../../../src/utils/webScroll';

export default function ProfileSettingsScreen() {
  const { t } = useTranslation();
  const webScroll = webScreenScrollStyles();
  const router = useRouter();
  const {
    firstName,
    setFirstName,
    lastName,
    setLastName,
    country,
    setCountry,
    phone,
    setPhone,
    loading,
    saving,
    persistProfile,
  } = useProfileForm();

  async function confirmSave() {
    const saved = await persistProfile();
    if (saved) {
      router.back();
    }
  }

  function handleSavePress() {
    Alert.alert(t('settings.saveChanges'), undefined, [
      { text: t('settings.cancel'), style: 'cancel' },
      {
        text: t('settings.saveConfirm'),
        onPress: () => {
          void confirmSave();
        },
      },
    ]);
  }

  return (
    <>
      <Stack.Screen options={{ title: t('settings.profile') }} />
      <SafeAreaView style={[styles.safe, webScroll.safe]} edges={['bottom']}>
        <ScrollView
          style={[styles.scroll, webScroll.scroll]}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {loading ? (
            <ActivityIndicator style={styles.loader} />
          ) : (
            <ProfileFormFields
              firstName={firstName}
              setFirstName={setFirstName}
              lastName={lastName}
              setLastName={setLastName}
              country={country}
              setCountry={setCountry}
              phone={phone}
              setPhone={setPhone}
              disabled={saving}
            />
          )}

          <Pressable
            style={({ pressed }) => [
              styles.saveButton,
              (saving || loading) && styles.saveDisabled,
              pressed && !saving && !loading && styles.savePressed,
            ]}
            onPress={handleSavePress}
            disabled={saving || loading}
            accessibilityRole="button"
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>{t('settings.saveConfirm')}</Text>
            )}
          </Pressable>
        </ScrollView>
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
