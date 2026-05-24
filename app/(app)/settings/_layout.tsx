import { Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { WebSettingsDetailPanel } from '../../../src/components/web/WebSettingsDetailPanel';
import { WebSettingsMenu } from '../../../src/components/web/WebSettingsMenu';
import { useDesktopWeb } from '../../../src/hooks/useDesktopWeb';
import { isAppRTL } from '../../../src/utils/rtl';

export default function SettingsLayout() {
  const isDesktopWeb = useDesktopWeb();

  if (isDesktopWeb) {
    return (
      <View
        style={[
          styles.desktopShell,
          isAppRTL() ? styles.desktopShellRtl : styles.desktopShellLtr,
        ]}
      >
        <WebSettingsMenu />
        <WebSettingsDetailPanel>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="customization" />
            <Stack.Screen name="notifications" />
            <Stack.Screen name="calendar-sync" />
            <Stack.Screen name="privacy" />
            <Stack.Screen name="couple" />
            <Stack.Screen name="about" />
            <Stack.Screen name="profile" />
          </Stack>
        </WebSettingsDetailPanel>
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: true,
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="customization" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="calendar-sync" />
      <Stack.Screen name="privacy" />
      <Stack.Screen name="couple" />
      <Stack.Screen name="about" />
      <Stack.Screen name="profile" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  desktopShell: {
    flex: 1,
    minHeight: 0,
  },
  desktopShellLtr: {
    flexDirection: 'row',
  },
  desktopShellRtl: {
    flexDirection: 'row-reverse',
  },
});
