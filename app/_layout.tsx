import { Redirect, Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { User } from 'firebase/auth';

import '../src/i18n';

function RootLayout() {
  const { t } = useTranslation();
  const router = useRouter();
  const segments = useSegments();
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    void import('../src/firebase/auth').then(({ onAuthStateChanged }) => {
      unsubscribe = onAuthStateChanged(setUser);
    });

    return () => {
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    if (user === undefined) {
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';
    const inAppGroup = segments[0] === '(app)';

    if (!user && !inAuthGroup) {
      router.replace('/login');
    } else if (user && !inAppGroup) {
      router.replace('/calendar');
    }
  }, [user, segments, router]);

  const isAuthLoading = user === undefined;
  const inAuthGroup = segments[0] === '(auth)';
  const inAppGroup = segments[0] === '(app)';

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>
      {isAuthLoading ? (
        <View style={styles.loadingOverlay} pointerEvents="auto">
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      ) : null}
      {!isAuthLoading && !user && !inAuthGroup ? (
        <Redirect href="/login" />
      ) : null}
      {!isAuthLoading && user && !inAppGroup ? (
        <Redirect href="/calendar" />
      ) : null}
    </>
  );
}

export default RootLayout;

const styles = StyleSheet.create({
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    gap: 12,
    zIndex: 1,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
});
