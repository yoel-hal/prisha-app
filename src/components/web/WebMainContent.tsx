import type { ReactNode } from 'react';
import { Platform, ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';

import {
  DESKTOP_MAIN_BACKGROUND,
  DESKTOP_MAIN_CONTENT_MAX_WIDTH,
} from '../../constants/layout';
import { useDesktopWeb } from '../../hooks/useDesktopWeb';
import { webScreenScrollStyles } from '../../utils/webScroll';

interface WebMainContentProps {
  children: ReactNode;
  /** When true, children are centered in a max-width column (e.g. add-period card). */
  centered?: boolean;
  /** Override max width of the inner content column. */
  maxWidth?: number;
  scrollable?: boolean;
}

/**
 * Desktop web main area: full remaining width, #f8f8f8 background, optional scroll.
 */
export function WebMainContent({
  children,
  centered = false,
  maxWidth = DESKTOP_MAIN_CONTENT_MAX_WIDTH,
  scrollable = true,
}: WebMainContentProps) {
  const isDesktopWeb = useDesktopWeb();
  const webScroll = webScreenScrollStyles();

  if (!isDesktopWeb) {
    return children;
  }

  const inner = (
    <View
      style={[
        styles.inner,
        centered && styles.innerCentered,
        { maxWidth },
      ]}
    >
      {children}
    </View>
  );

  if (!scrollable) {
    return (
      <View style={[styles.main, styles.mainFill]}>
        {inner}
      </View>
    );
  }

  return (
    <View style={styles.main}>
      <ScrollView
        style={webScroll.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          centered && styles.scrollContentCentered,
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {inner}
      </ScrollView>
    </View>
  );
}

const webMainFill: ViewStyle =
  Platform.OS === 'web'
    ? ({ minHeight: '100%' } as unknown as ViewStyle)
    : {};

const styles = StyleSheet.create({
  main: {
    flex: 1,
    backgroundColor: DESKTOP_MAIN_BACKGROUND,
    ...webMainFill,
  },
  mainFill: {
    padding: 32,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 32,
    paddingBottom: 48,
  },
  scrollContentCentered: {
    alignItems: 'center',
  },
  inner: {
    width: '100%',
    alignSelf: 'center',
  },
  innerCentered: {
    alignSelf: 'center',
  },
});
