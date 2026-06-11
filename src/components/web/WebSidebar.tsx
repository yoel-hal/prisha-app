import type { WebIconName } from '@/components/common/iconPaths';
import { Icon } from '@/components/common/Icon';
import type { Href } from 'expo-router';
import { usePathname, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  DESKTOP_SIDEBAR_BORDER,
  DESKTOP_SIDEBAR_WIDTH,
} from '../../constants/layout';
import { isAppRTL, textStartStyle } from '../../utils/rtl';
import { BuyMeCoffeeButton } from '../common/BuyMeCoffeeButton';

type NavItem = {
  href: Href;
  labelKey: string;
  icon: WebIconName;
  match: (pathname: string) => boolean;
};

const NAV_ITEMS: NavItem[] = [
  {
    href: '/calendar',
    labelKey: 'navigation.calendar',
    icon: 'calendar',
    match: (pathname) => pathname.includes('/calendar'),
  },
  {
    href: '/upcoming',
    labelKey: 'navigation.upcoming',
    icon: 'list',
    match: (pathname) => pathname.includes('/upcoming'),
  },
  {
    href: '/add-period',
    labelKey: 'navigation.add',
    icon: 'plus-circle',
    match: (pathname) =>
      pathname.includes('/add-period') || pathname.includes('/edit-period'),
  },
  {
    href: '/settings',
    labelKey: 'navigation.settings',
    icon: 'settings',
    match: (pathname) => pathname.includes('/settings'),
  },
];

export function WebSidebar() {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const rtl = isAppRTL();

  return (
    <View
      style={[
        styles.sidebar,
        rtl ? styles.sidebarRtl : styles.sidebarLtr,
      ]}
    >
      <Text style={[styles.brand, textStartStyle()]}>פרישה טרקר</Text>

      <View style={styles.nav}>
        {NAV_ITEMS.map((item) => {
          const active = item.match(pathname);
          return (
            <Pressable
              key={item.href.toString()}
              style={[styles.navItem, active && styles.navItemActive]}
              onPress={() => router.push(item.href)}
            >
              <Icon
                name={item.icon}
                size={20}
                color={active ? '#1a1a1a' : '#666'}
              />
              <Text
                style={[
                  styles.navLabel,
                  textStartStyle(),
                  active && styles.navLabelActive,
                ]}
              >
                {t(item.labelKey)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.footer}>
        <BuyMeCoffeeButton />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: DESKTOP_SIDEBAR_WIDTH,
    backgroundColor: '#ffffff',
    paddingTop: 24,
    paddingHorizontal: 16,
    paddingBottom: 20,
    justifyContent: 'flex-start',
  },
  sidebarLtr: {
    borderEndWidth: StyleSheet.hairlineWidth,
    borderEndColor: DESKTOP_SIDEBAR_BORDER,
  },
  sidebarRtl: {
    borderStartWidth: StyleSheet.hairlineWidth,
    borderStartColor: DESKTOP_SIDEBAR_BORDER,
  },
  brand: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 28,
    paddingHorizontal: 4,
  },
  nav: {
    flex: 1,
    gap: 4,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  navItemActive: {
    backgroundColor: '#f0f0f0',
  },
  navLabel: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
  },
  navLabelActive: {
    color: '#1a1a1a',
    fontWeight: '600',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 16,
  },
});
