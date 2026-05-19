import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { signOut } from '../../../src/firebase/auth';
import { useSettings } from '../../../src/hooks/useSettings';
import { isAppRTL, textStartStyle } from '../../../src/utils/rtl';

type SettingsRoute =
  | '/settings/customization'
  | '/settings/notifications'
  | '/settings/calendar-sync'
  | '/settings/privacy'
  | '/settings/couple'
  | '/settings/about';

function SettingsRow({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <Text style={[styles.rowLabel, textStartStyle()]}>{label}</Text>
      <Feather
        name={isAppRTL() ? 'chevron-left' : 'chevron-right'}
        size={20}
        color="#999"
      />
    </Pressable>
  );
}

export default function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { currentLanguage, setLanguage } = useSettings();
  const [signingOut, setSigningOut] = useState(false);

  function navigate(route: SettingsRoute) {
    router.push(route);
  }

  async function handleSignOut() {
    setSigningOut(true);
    const result = await signOut();
    setSigningOut(false);

    if (result.success) {
      router.replace('/login');
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.title, textStartStyle()]}>{t('settings.title')}</Text>

        <Text style={[styles.sectionHeader, textStartStyle()]}>
          {t('settings.language')}
        </Text>
        <View style={styles.languageRow}>
          <LanguageButton
            label="עברית"
            active={currentLanguage === 'he'}
            onPress={() => void setLanguage('he')}
          />
          <LanguageButton
            label="English"
            active={currentLanguage === 'en'}
            onPress={() => void setLanguage('en')}
          />
        </View>

        <View style={[styles.group, styles.groupSpaced]}>
          <SettingsRow
            label={t('settings.customization')}
            onPress={() => navigate('/settings/customization')}
          />
          <SettingsRow
            label={t('settings.notifications')}
            onPress={() => navigate('/settings/notifications')}
          />
          <SettingsRow
            label={t('settings.calendarSync')}
            onPress={() => navigate('/settings/calendar-sync')}
          />
          <SettingsRow
            label={t('settings.privacy')}
            onPress={() => navigate('/settings/privacy')}
          />
          <SettingsRow
            label={t('settings.coupleSync')}
            onPress={() => navigate('/settings/couple')}
          />
          <SettingsRow
            label={t('settings.about')}
            onPress={() => navigate('/settings/about')}
          />
        </View>

        <Pressable
          style={styles.signOutButton}
          onPress={() => void handleSignOut()}
          disabled={signingOut}
        >
          {signingOut ? (
            <ActivityIndicator color="#C62828" />
          ) : (
            <Text style={styles.signOutText}>{t('auth.signOut')}</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function LanguageButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.langButton, active && styles.langButtonActive]}
      onPress={onPress}
    >
      <Text style={[styles.langText, active && styles.langTextActive]}>
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
    padding: 20,
    paddingBottom: 40,
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    marginTop: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  languageRow: {
    flexDirection: 'row',
    gap: 12,
  },
  langButton: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  langButtonActive: {
    backgroundColor: '#1a1a1a',
    borderColor: '#1a1a1a',
  },
  langText: {
    fontSize: 16,
  },
  langTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  group: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e5e5',
    borderRadius: 12,
    overflow: 'hidden',
  },
  groupSpaced: {
    marginTop: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  rowLabel: {
    fontSize: 16,
    flex: 1,
  },
  signOutButton: {
    marginTop: 32,
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#FFCDD2',
    backgroundColor: '#FFEBEE',
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#C62828',
  },
});
