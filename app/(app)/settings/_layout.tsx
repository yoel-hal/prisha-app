import { Stack } from 'expo-router';

export default function SettingsLayout() {
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
