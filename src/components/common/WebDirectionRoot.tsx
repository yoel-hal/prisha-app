import type { PropsWithChildren } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet, View } from 'react-native';

/**
 * Web only: gives React Native Web the app's writing direction. Its `dir` prop sets
 * the DOM direction and the locale context that resolves start/end styles, which
 * I18nManager cannot do in the browser. Native relies on I18nManager instead.
 */
export function WebDirectionRoot({ children }: PropsWithChildren) {
  const { i18n } = useTranslation();

  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }

  const isHebrew = i18n.language === 'he' || i18n.language.startsWith('he-');
  // `dir` and `lang` are React Native Web View props that the native types don't declare.
  const webProps = { dir: isHebrew ? 'rtl' : 'ltr', lang: i18n.language } as object;

  return (
    <View style={styles.root} {...webProps}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
