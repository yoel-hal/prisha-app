import { Feather } from '@expo/vector-icons';
import type { Href } from 'expo-router';
import { usePathname, useRouter } from 'expo-router';
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

import { signOut } from '../../firebase/auth';
import { useSettings } from '../../hooks/useSettings';
import { isAppRTL, textStartStyle } from '../../utils/rtl';
import { DESKTOP_SIDEBAR_BORDER } from '../../constants/layout';

type SettingsHref =
  | '/settings/customization'
  | '/settings/notifications'
  | '/settings/calendar-sync'
  | '/settings/privacy'
  | '/settings/couple'
  | '/settings/about';

const MENU_ITEMS: { href: SettingsHref; labelKey: string }[] = [
  { href: '/settings/customization', labelKey: 'settings.customization' },
  { href: '/settings/notifications', labelKey: 'settings.notifications' },
  { href: '/settings/calendar-sync', labelKey: 'settings.calendarSync' },
  { href: '/settings/privacy', labelKey: 'settings.privacy' },
  { href: '/settings/couple', labelKey: 'settings.coupleSync' },
  { href: '/settings/about', labelKey: 'settings.about' },
];

export function WebSettingsMenu() {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const { currentLanguage, setLanguage } = useSettings();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    const result = await signOut();
    setSigningOut(false);
    if (result.success) {
      router.replace('/login');
    }
  }

  return (
    <View style={styles.menu}>
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

      <ScrollView style={styles.navScroll} contentContainerStyle={styles.nav}>
        {MENU_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.endsWith(item.href);
          return (
            <Pressable
              key={item.href}
              style={[styles.navItem, active && styles.navItemActive]}
              onPress={() => router.push(item.href)}
            >
              <Text
                style={[
                  styles.navLabel,
                  textStartStyle(),
                  active && styles.navLabelActive,
                ]}
              >
                {t(item.labelKey)}
              </Text>
              <Feather
                name={isAppRTL() ? 'chevron-left' : 'chevron-right'}
                size={18}
                color={active ? '#1a1a1a' : '#bbb'}
              />
            </Pressable>
          );
        })}
      </ScrollView>

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
    </View>
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
      <Text style={[styles.langText, active && styles.langTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  menu: {
    width: 280,
    backgroundColor: '#fff',
    borderEndWidth: StyleSheet.hairlineWidth,
    borderEndColor: DESKTOP_SIDEBAR_BORDER,
    padding: 24,
    paddingBottom: 20,
    gap: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    marginTop: 8,
  },
  languageRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  langButton: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  langButtonActive: {
    backgroundColor: '#1a1a1a',
    borderColor: '#1a1a1a',
  },
  langText: {
    fontSize: 14,
  },
  langTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  navScroll: {
    flex: 1,
  },
  nav: {
    gap: 2,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  navItemActive: {
    backgroundColor: '#f0f0f0',
  },
  navLabel: {
    fontSize: 15,
    color: '#444',
    flex: 1,
  },
  navLabelActive: {
    color: '#1a1a1a',
    fontWeight: '600',
  },
  signOutButton: {
    marginTop: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#FFCDD2',
    backgroundColor: '#FFEBEE',
  },
  signOutText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#C62828',
  },
});
