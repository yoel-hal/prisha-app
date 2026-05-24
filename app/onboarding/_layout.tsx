import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{ headerShown: false }}
      initialRouteName="welcome"
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="language" />
      <Stack.Screen name="auth" />
      <Stack.Screen name="register" />
      <Stack.Screen name="login" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="minhag" />
      <Stack.Screen name="chumrot" />
      <Stack.Screen name="done" />
    </Stack>
  );
}
