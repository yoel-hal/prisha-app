import { Icon } from '@/components/common/Icon';
import { usePathname, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { SettingsProfileCard } from '../settings/SettingsProfileCard';
import { signOut } from '../../firebase/auth';
import { useSettings } from '../../hooks/useSettings';
import { useAuthStore } from '../../store/authStore';
import { showDeleteAccountAlert } from '../../utils/deleteAccountAlert';
import { isAppRTL, textStartStyle } from '../../utils/rtl';
import { DESKTOP_SIDEBAR_BORDER } from '../../constants/layout';

const DESKTOP_SETTINGS_MENU_WIDTH = 300;

type SettingsHref =
  | '/settings/customization'
  | '/settings/notifications'
  | '/settings/calendar-sync'
  | '/settings/privacy'
  | '/settings/couple'
  | '/settings/about'
  | '/settings/profile';

const MAIN_MENU_ITEMS: { href: SettingsHref; labelKey: string }[] = [
  { href: '/settings/customization', labelKey: 'settings.customization' },
  { href: '/settings/notifications', labelKey: 'settings.notifications' },
  { href: '/settings/calendar-sync', labelKey: 'settings.calendarSync' },
  { href: '/settings/privacy', labelKey: 'settings.privacy' },
  { href: '/settings/couple', labelKey: 'settings.coupleSync' },
  { href: '/settings/about', labelKey: 'settings.about' },
];

function MenuRow({
  label,
  active,
  onPress,
  showBadge,
  isLast = false,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  showBadge?: boolean;
  isLast?: boolean;
}) {
  return (
    <Pressable
      style={[styles.row, active && styles.rowActive, isLast && styles.rowLast]}
      onPress={onPress}
    >
      <View style={styles.rowLabelWrap}>
        <Text
          style={[
            styles.rowLabel,
            textStartStyle(),
            active && styles.rowLabelActive,
          ]}
        >
          {label}
        </Text>
        {showBadge ? <View style={styles.menuBadge} /> : null}
      </View>
      <Icon
        name={isAppRTL() ? 'chevron-left' : 'chevron-right'}
        size={18}
        color={active ? '#1a1a1a' : '#bbb'}
      />
    </Pressable>
  );
}

function GroupHeader({ label }: { label: string }) {
  return (
    <View style={styles.groupHeader}>
      <Text style={[styles.groupHeaderText, textStartStyle()]}>{label}</Text>
    </View>
  );
}

export function WebSettingsMenu() {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const { currentLanguage, setLanguage } = useSettings();
  const isPartnerMode = useAuthStore((state) => state.isPartnerMode);
  const [signingOut, setSigningOut] = useState(false);

  function isActive(href: string): boolean {
    return pathname === href || pathname.endsWith(href);
  }

  function navigate(href: SettingsHref) {
    router.push(href);
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
    <View style={styles.menu}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator
      >
        <Text style={[styles.title, textStartStyle()]}>{t('settings.title')}</Text>

        {!isPartnerMode ? (
          <SettingsProfileCard
            showEditIcon
            onPress={() => navigate('/settings/profile')}
          />
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

        <View style={styles.group}>
          {MAIN_MENU_ITEMS.map((item) => (
            <MenuRow
              key={item.href}
              label={t(item.labelKey)}
              active={isActive(item.href)}
              onPress={() => navigate(item.href)}
              showBadge={false}
            />
          ))}
          {!isPartnerMode ? (
            <>
              <GroupHeader label={t('settings.account')} />
              <MenuRow
                label={t('settings.profile')}
                active={isActive('/settings/profile')}
                onPress={() => navigate('/settings/profile')}
              />
              <MenuRow
                label={t('settings.deleteAccount')}
                active={false}
                onPress={() => showDeleteAccountAlert(t)}
                isLast
              />
            </>
          ) : null}
        </View>

        {!isPartnerMode ? (
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
        ) : null}
      </ScrollView>
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
    width: DESKTOP_SETTINGS_MENU_WIDTH,
    flexShrink: 0,
    alignSelf: 'stretch',
    backgroundColor: '#fff',
    borderEndWidth: StyleSheet.hairlineWidth,
    borderEndColor: DESKTOP_SIDEBAR_BORDER,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 32,
    gap: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    marginTop: 12,
    marginBottom: 8,
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
  group: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e5e5',
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 4,
  },
  groupHeader: {
    paddingVertical: 10,
    paddingHorizontal: 14,
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
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as const } : {}),
  },
  rowActive: {
    backgroundColor: '#f5f5f5',
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowLabelWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowLabel: {
    fontSize: 15,
    color: '#444',
    flex: 1,
  },
  rowLabelActive: {
    color: '#1a1a1a',
    fontWeight: '600',
  },
  menuBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E53935',
  },
  signOutButton: {
    marginTop: 24,
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
