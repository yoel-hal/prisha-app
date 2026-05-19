import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';

import { useDesktopWeb } from '../../hooks/useDesktopWeb';

interface DesktopWebShellProps {
  children: ReactNode;
}

/**
 * Root web wrapper — ensures full viewport height on desktop web.
 * App layout (sidebar, main area) lives inside (app)/_layout via WebAppShell.
 */
export function DesktopWebShell({ children }: DesktopWebShellProps) {
  const isDesktopWeb = useDesktopWeb();

  if (!isDesktopWeb || Platform.OS !== 'web') {
    return children;
  }

  return <View style={styles.root}>{children}</View>;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: '100%',
    ...(Platform.OS === 'web'
      ? ({ minHeight: '100vh' } as unknown as ViewStyle)
      : null),
  },
});
