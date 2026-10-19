import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet, View } from 'react-native';

import { Icon } from '../../../src/components/common/Icon';

import { WebSettingsDetailPanel } from '../../../src/components/web/WebSettingsDetailPanel';
import { WebSettingsMenu } from '../../../src/components/web/WebSettingsMenu';
import { useDesktopWeb } from '../../../src/hooks/useDesktopWeb';
import { isAppRTL } from '../../../src/utils/rtl';

export default function SettingsLayout() {
  const { t } = useTranslation();
  const isDesktopWeb = useDesktopWeb();

  if (isDesktopWeb) {
    return (
      <View
        style={styles.desktopShell}
      >
        <WebSettingsMenu />
        <WebSettingsDetailPanel>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="customization" />
            <Stack.Screen name="notifications" />
            <Stack.Screen name="calendar-sync" />
            <Stack.Screen name="location" />
            <Stack.Screen name="privacy" />
            <Stack.Screen name="couple" />
            <Stack.Screen name="about" />
            <Stack.Screen name="profile" />
            <Stack.Screen name="delete-account-reauth" />
          </Stack>
        </WebSettingsDetailPanel>
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        // React Navigation mirrors its back arrow from I18nManager, which the browser ignores.
        ...(Platform.OS === 'web'
          ? {
              headerBackImage: ({ tintColor }: { tintColor: string }) => (
                <Icon
                  name={isAppRTL() ? 'arrow-right' : 'arrow-left'}
                  size={24}
                  color={tintColor}
                />
              ),
            }
          : null),
      }}
    >
      {/* The title is what the back button on sub-pages shows (otherwise the route name, "index"). */}
      <Stack.Screen name="index" options={{ headerShown: false, title: t('settings.title') }} />
      <Stack.Screen name="customization" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="calendar-sync" />
      <Stack.Screen name="location" />
      <Stack.Screen name="privacy" />
      <Stack.Screen name="couple" />
      <Stack.Screen name="about" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="delete-account-reauth" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  desktopShell: {
    flex: 1,
    flexDirection: 'row',
    minHeight: 0,
  },
});
