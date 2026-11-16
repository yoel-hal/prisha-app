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
  | '/settings/tahara'
  | '/settings/calendar-sync'
  | '/settings/location'
  | '/settings/privacy'
  | '/settings/couple'
  | '/settings/about'
  | '/settings/profile';

const MAIN_MENU_ITEMS: { href: SettingsHref; labelKey: string }[] = [
  { href: '/settings/customization', labelKey: 'settings.customization' },
  { href: '/settings/tahara', labelKey: 'settings.tahara' },
  { href: '/settings/notifications', labelKey: 'settings.notifications' },
  { href: '/settings/calendar-sync', labelKey: 'settings.calendarSync' },
  { href: '/settings/location', labelKey: 'settings.location' },
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
  destructive = false,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  showBadge?: boolean;
  isLast?: boolean;
  /** Red label and no chevron: the row runs an action instead of opening a page. */
  destructive?: boolean;
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
            destructive && styles.rowLabelDestructive,
          ]}
        >
          {label}
        </Text>
        {showBadge ? <View style={styles.menuBadge} /> : null}
      </View>
      {destructive ? null : (
        <Icon
          name={isAppRTL() ? 'chevron-left' : 'chevron-right'}
          size={18}
          color={active ? '#1a1a1a' : '#bbb'}
        />
      )}
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
          <GroupHeader label={t('settings.general')} />
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
                destructive
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
            <ActivityIndicator color="#B3261E" />
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
    backgroundColor: '#FBF8F5',
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
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: '#857A7F',
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
    borderColor: '#EAE3DD',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  langButtonActive: {
    backgroundColor: '#A8485F',
    borderColor: '#A8485F',
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
    borderColor: '#EAE3DD',
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 4,
  },
  groupHeader: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EAE3DD',
  },
  groupHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#857A7F',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EAE3DD',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as const } : {}),
  },
  rowActive: {
    backgroundColor: '#F4EFEA',
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
    color: '#5F5459',
    flex: 1,
  },
  rowLabelActive: {
    color: '#2A2226',
    fontWeight: '600',
  },
  rowLabelDestructive: {
    color: '#B3261E',
  },
  menuBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#B3261E',
  },
  signOutButton: {
    marginTop: 24,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#F2C9C4',
    backgroundColor: '#FBEAE8',
  },
  signOutText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#B3261E',
  },
});
