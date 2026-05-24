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
import { useDesktopWeb } from '../../../src/hooks/useDesktopWeb';
import { useSettings } from '../../../src/hooks/useSettings';
import { useAuthStore } from '../../../src/store/authStore';
import {
  getDisplayFullName,
  getProfileInitials,
} from '../../../src/utils/profileDisplay';
import { showDeleteAccountAlert } from '../../../src/utils/deleteAccountAlert';
import { isAppRTL, textStartStyle } from '../../../src/utils/rtl';
import { webScreenScrollStyles } from '../../../src/utils/webScroll';

type SettingsRoute =
  | '/settings/customization'
  | '/settings/notifications'
  | '/settings/calendar-sync'
  | '/settings/privacy'
  | '/settings/couple'
  | '/settings/about'
  | '/settings/profile';

function SettingsRow({
  label,
  onPress,
  isLast = false,
}: {
  label: string;
  onPress: () => void;
  isLast?: boolean;
}) {
  return (
    <Pressable
      style={[styles.row, isLast && styles.rowLast]}
      onPress={onPress}
    >
      <Text style={[styles.rowLabel, textStartStyle()]}>{label}</Text>
      <Feather
        name={isAppRTL() ? 'chevron-left' : 'chevron-right'}
        size={20}
        color="#999"
      />
    </Pressable>
  );
}

function SettingsGroupHeader({ label }: { label: string }) {
  return (
    <View style={styles.groupHeader}>
      <Text style={[styles.groupHeaderText, textStartStyle()]}>{label}</Text>
    </View>
  );
}

export default function SettingsScreen() {
  const { t } = useTranslation();
  const isDesktopWeb = useDesktopWeb();
  const webScroll = webScreenScrollStyles();
  const router = useRouter();

  if (isDesktopWeb) {
    return null;
  }

  const user = useAuthStore((state) => state.user);
  const firstName = useAuthStore((state) => state.firstName);
  const lastName = useAuthStore((state) => state.lastName);
  const { currentLanguage, setLanguage } = useSettings();
  const [signingOut, setSigningOut] = useState(false);

  const email = user?.email ?? '';
  const fullName = getDisplayFullName(firstName, lastName);
  const showName = fullName.length > 0;
  const initials = getProfileInitials(firstName, lastName, email);

  function navigate(route: SettingsRoute) {
    router.push(route);
  }

  async function handleSignOut() {
    setSigningOut(true);
    const result = await signOut();
    setSigningOut(false);

    if (result.success) {
      router.replace('/onboarding/login');
    }
  }

  return (
    <SafeAreaView style={[styles.safe, webScroll.safe]} edges={['top']}>
      <ScrollView style={webScroll.scroll} contentContainerStyle={styles.scroll}>
        <Text style={[styles.title, textStartStyle()]}>{t('settings.title')}</Text>

        {email ? (
          <View style={styles.accountCard}>
            <Pressable
              style={styles.avatarPressable}
              onPress={() => navigate('/settings/profile')}
              accessibilityRole="button"
              accessibilityLabel={t('settings.profile')}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <View style={styles.avatarEditBadge}>
                <Feather name="edit-2" size={12} color="#fff" />
              </View>
            </Pressable>
            <View style={styles.accountInfo}>
              {showName ? (
                <Text style={[styles.accountName, textStartStyle()]}>{fullName}</Text>
              ) : null}
              <Text
                style={[
                  showName ? styles.accountEmailMuted : styles.accountEmailPrimary,
                  textStartStyle(),
                ]}
              >
                {email}
              </Text>
            </View>
          </View>
        ) : null}

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
          <SettingsGroupHeader label={t('settings.account')} />
          <SettingsRow
            label={t('settings.profile')}
            onPress={() => navigate('/settings/profile')}
          />
          <SettingsRow
            label={t('settings.deleteAccount')}
            onPress={() => showDeleteAccountAlert(t)}
            isLast
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
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  avatarPressable: {
    position: 'relative',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#4A90D9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  avatarEditBadge: {
    position: 'absolute',
    end: -2,
    bottom: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  accountInfo: {
    flex: 1,
    gap: 2,
  },
  accountName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  accountEmailPrimary: {
    fontSize: 15,
    color: '#1a1a1a',
  },
  accountEmailMuted: {
    fontSize: 14,
    color: '#6b7280',
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
  groupHeader: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#f7f7f7',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  groupHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
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
  rowLast: {
    borderBottomWidth: 0,
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
