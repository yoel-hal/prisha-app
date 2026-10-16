import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';

import { useDesktopWeb } from '../../hooks/useDesktopWeb';
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

  return (
    <View style={styles.shell}>
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
    flexDirection: 'row',
    ...webShellFill,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
});
