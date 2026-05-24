import { Redirect, Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import type { User } from 'firebase/auth';

import { DesktopWebShell } from '../src/components/common/DesktopWebShell';
import '../src/i18n';
import { getSettings } from '../src/firebase/firestore';
import { bootstrapCoupleForAuthUser } from '../src/hooks/useCouple';
import { useAuthStore } from '../src/store/authStore';
import { useOnboardingStore } from '../src/store/onboardingStore';
import { useSettingsStore } from '../src/store/settingsStore';
import { log } from '../src/utils/log';
import {
  getIncompleteOnboardingHref,
  profileFromAuthStore,
  type IncompleteOnboardingHref,
} from '../src/utils/onboardingRoute';

function RootLayout() {
  const { t } = useTranslation();
  const router = useRouter();
  const segments = useSegments();
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [coupleBootstrapped, setCoupleBootstrapped] = useState(false);
  const [settingsChecked, setSettingsChecked] = useState(false);
  const [incompleteOnboardingHref, setIncompleteOnboardingHref] =
    useState<IncompleteOnboardingHref>('/onboarding/profile');
  const settingsCheckedForRef = useRef<string | null>(null);
  const onboardingLoaded = useOnboardingStore((state) => state.loaded);
  const onboardingComplete = useOnboardingStore((state) => state.complete);
  const hydrateOnboarding = useOnboardingStore((state) => state.hydrate);
  const setAuthUser = useAuthStore((state) => state.setUser);
  const coupleId = useAuthStore((state) => state.coupleId);
  const loadSettings = useSettingsStore((state) => state.loadSettings);

  useEffect(() => {
    void hydrateOnboarding();
  }, [hydrateOnboarding]);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    void import('../src/firebase/auth').then(({ onAuthStateChanged }) => {
      unsubscribe = onAuthStateChanged((nextUser) => {
        setUser(nextUser);
        setAuthUser(nextUser);
        if (!nextUser) {
          setCoupleBootstrapped(false);
          settingsCheckedForRef.current = null;
          setSettingsChecked(true);
        }
      });
    });

    return () => {
      unsubscribe?.();
    };
  }, [setAuthUser]);

  useEffect(() => {
    if (!user?.uid) {
      setCoupleBootstrapped(!user);
      setSettingsChecked(true);
      return;
    }

    let cancelled = false;
    setCoupleBootstrapped(false);
    setSettingsChecked(false);
    settingsCheckedForRef.current = null;

    log('[RootLayout] bootstrapping couple for user', {
      uid: user.uid,
      email: user.email ?? null,
      hasEmail: Boolean(user.email),
    });

    void bootstrapCoupleForAuthUser(user.uid, user.email).finally(() => {
      if (!cancelled) {
        const { pendingInvite, coupleId } = useAuthStore.getState();
        log('[RootLayout] couple bootstrap complete', {
          coupleId,
          pendingInvite,
          bannerWillShow: pendingInvite !== null,
        });
        setCoupleBootstrapped(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [user?.uid, user?.email]);

  useEffect(() => {
    if (coupleId) {
      void loadSettings(coupleId);
    }
  }, [coupleId, loadSettings]);

  useEffect(() => {
    if (user === undefined || !onboardingLoaded) {
      return;
    }

    if (user && !coupleBootstrapped) {
      setSettingsChecked(false);
      return;
    }

    let cancelled = false;

    void (async () => {
      let resumeHref: IncompleteOnboardingHref = '/onboarding/profile';

      if (user) {
        const resolvedCoupleId = coupleId ?? useAuthStore.getState().coupleId;
        const settingsCacheKey = `${user.uid}:${resolvedCoupleId ?? ''}`;

        if (settingsCheckedForRef.current !== settingsCacheKey) {
          setSettingsChecked(false);

          if (resolvedCoupleId) {
            const settings = await getSettings(resolvedCoupleId);
            if (cancelled) {
              return;
            }
            resumeHref = getIncompleteOnboardingHref(
              profileFromAuthStore(),
              settings !== null,
              user,
            );
          } else {
            resumeHref = getIncompleteOnboardingHref(
              profileFromAuthStore(),
              false,
              user,
            );
          }
          if (cancelled) {
            return;
          }

          settingsCheckedForRef.current = settingsCacheKey;
          setIncompleteOnboardingHref(resumeHref);
          setSettingsChecked(true);
        } else {
          resumeHref = incompleteOnboardingHref;
        }
      } else {
        setSettingsChecked(true);
      }

      const inAuthGroup = segments[0] === '(auth)';
      const inAppGroup = segments[0] === '(app)';
      const inOnboarding = segments[0] === 'onboarding';

      if (!user) {
        if (inAuthGroup || inOnboarding) {
          return;
        }
        router.replace('/onboarding/welcome');
        return;
      }

      if (!onboardingComplete) {
        if (inOnboarding) {
          return;
        }
        router.replace(resumeHref);
        return;
      }

      if (!inAppGroup) {
        router.replace('/calendar');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    user,
    onboardingComplete,
    onboardingLoaded,
    coupleBootstrapped,
    coupleId,
    incompleteOnboardingHref,
    segments,
    router,
  ]);

  const isAuthLoading = user === undefined;
  const isBootstrapping =
    isAuthLoading ||
    !onboardingLoaded ||
    (!!user && !coupleBootstrapped) ||
    (!!user && !settingsChecked);
  const inAuthGroup = segments[0] === '(auth)';
  const inAppGroup = segments[0] === '(app)';
  const inOnboarding = segments[0] === 'onboarding';

  const showLoggedOutRedirect =
    !isBootstrapping && !user && !inAuthGroup && !inOnboarding;
  const showLoggedInIncompleteRedirect =
    !isBootstrapping && !!user && !onboardingComplete && !inOnboarding;
  const showLoggedInCompleteRedirect =
    !isBootstrapping && !!user && onboardingComplete && !inAppGroup;

  return (
    <GestureHandlerRootView style={styles.root}>
      <DesktopWebShell>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(app)" />
        </Stack>
        {isBootstrapping ? (
          <View style={styles.loadingOverlay} pointerEvents="auto">
            <ActivityIndicator size="large" />
            <Text style={styles.loadingText}>{t('common.loading')}</Text>
          </View>
        ) : null}
        {showLoggedOutRedirect ? (
          <Redirect href="/onboarding/welcome" />
        ) : null}
        {showLoggedInIncompleteRedirect ? (
          <Redirect href={incompleteOnboardingHref} />
        ) : null}
        {showLoggedInCompleteRedirect ? (
          <Redirect href="/calendar" />
        ) : null}
      </DesktopWebShell>
    </GestureHandlerRootView>
  );
}

export default RootLayout;

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
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
