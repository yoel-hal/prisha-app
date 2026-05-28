import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      initialRouteName="beta-gate"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="beta-gate" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="partner_login" />
    </Stack>
  );
}
