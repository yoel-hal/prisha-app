import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';

import { useDesktopWeb } from '../../hooks/useDesktopWeb';
import { isAppRTL } from '../../utils/rtl';
import { WebSidebar } from './WebSidebar';

interface WebAppShellProps {
  children: ReactNode;
}

/** Sidebar + main content row for desktop web; passthrough on mobile. */
export function WebAppShell({ children }: WebAppShellProps) {
  const isDesktopWeb = useDesktopWeb();

  if (!isDesktopWeb) {
    return children;
  }

  const rtl = isAppRTL();

  return (
    <View style={[styles.shell, rtl ? styles.shellRtl : styles.shellLtr]}>
      <WebSidebar />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const webShellFill: ViewStyle =
  Platform.OS === 'web'
    ? ({ minHeight: '100vh' } as unknown as ViewStyle)
    : {};

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    ...webShellFill,
  },
  shellLtr: {
    flexDirection: 'row',
  },
  shellRtl: {
    flexDirection: 'row-reverse',
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
});
