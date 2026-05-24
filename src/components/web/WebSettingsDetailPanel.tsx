import { usePathname } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { SettingsProfileCard } from '../settings/SettingsProfileCard';
import { DESKTOP_MAIN_BACKGROUND } from '../../constants/layout';

const DETAIL_SEGMENTS = new Set([
  'customization',
  'notifications',
  'calendar-sync',
  'privacy',
  'couple',
  'about',
  'profile',
]);

export function pathnameShowsSettingsDetail(pathname: string): boolean {
  const segments = pathname.split('/').filter(Boolean);
  const settingsIndex = segments.indexOf('settings');
  if (settingsIndex === -1) {
    return false;
  }
  const sub = segments[settingsIndex + 1];
  return sub !== undefined && DETAIL_SEGMENTS.has(sub);
}

type WebSettingsDetailPanelProps = {
  children: ReactNode;
};

/** Right column: profile card + optional detail route content. */
export function WebSettingsDetailPanel({ children }: WebSettingsDetailPanelProps) {
  const pathname = usePathname();
  const showDetail = pathnameShowsSettingsDetail(pathname);

  return (
    <View style={styles.column}>
      <View style={styles.profileHeader}>
        <SettingsProfileCard />
      </View>
      {showDetail ? <View style={styles.detailPanel}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    flex: 1,
    minWidth: 0,
    backgroundColor: DESKTOP_MAIN_BACKGROUND,
    padding: 24,
    gap: 16,
  },
  profileHeader: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e5e5',
    paddingHorizontal: 16,
  },
  detailPanel: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e5e5',
    overflow: 'hidden',
    minHeight: 320,
  },
});
