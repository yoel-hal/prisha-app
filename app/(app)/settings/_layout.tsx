import { Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { WebMainContent } from '../../../src/components/web/WebMainContent';
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
        <WebMainContent>
          <View style={styles.panel}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="customization" />
              <Stack.Screen name="notifications" />
              <Stack.Screen name="calendar-sync" />
              <Stack.Screen name="privacy" />
              <Stack.Screen name="couple" />
              <Stack.Screen name="about" />
            </Stack>
          </View>
        </WebMainContent>
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
    </Stack>
  );
}

const styles = StyleSheet.create({
  desktopShell: {
    flex: 1,
  },
  desktopShellLtr: {
    flexDirection: 'row',
  },
  desktopShellRtl: {
    flexDirection: 'row-reverse',
  },
  panel: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e5e5',
    overflow: 'hidden',
    minHeight: 400,
  },
});
