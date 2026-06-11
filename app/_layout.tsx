import '../global.css';

import { useFonts } from 'expo-font';
import * as Linking from 'expo-linking';
import { useURL } from 'expo-linking';
import { Redirect, Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  AppState,
  Platform,
  StyleSheet,
  Text,
  View,
  type AppStateStatus,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import type { User } from 'firebase/auth';

import { AppLockGate } from '../src/components/common/AppLockGate';
import { DeleteAccountLoadingOverlay } from '../src/components/common/DeleteAccountLoadingOverlay';
import { DesktopWebShell } from '../src/components/common/DesktopWebShell';
import { Toast } from '../src/components/common/Toast';
import { hydrateAppLockFromStorage } from '../src/hooks/useAppLock';
import '../src/i18n';
import { getUserDocument } from '../src/firebase/firestore';
import {
  bootstrapCoupleForAuthUser,
  bootstrapPartnerMode,
} from '../src/hooks/useCouple';  
import { useAuthStore } from '../src/store/authStore';
import { usePinStore } from '../src/store/pinStore';
import { useSettingsStore } from '../src/store/settingsStore';
import { log } from '../src/utils/log';

function RootLayout() {
  const { t } = useTranslation();
  const router = useRouter();
  const segments = useSegments();
  const [fontsLoaded] = useFonts(
    Platform.OS === 'web'
      ? {}
      : {
          Feather: require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Feather.ttf'),
        },
  );
  const webFontsReady = Platform.OS === 'web';
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [partnerSessionChecked, setPartnerSessionChecked] = useState(false);
  const [userDocReady, setUserDocReady] = useState(false);
  const [coupleBootstrapped, setCoupleBootstrapped] = useState(false);
  const setAuthUser = useAuthStore((state) => state.setUser);
  const setFirestoreOnboardingComplete = useAuthStore(
    (state) => state.setFirestoreOnboardingComplete,
  );
  const onboardingComplete = useAuthStore(
    (state) => state.firestoreOnboardingComplete,
  );
  const isPartnerMode = useAuthStore((state) => state.isPartnerMode);
  const coupleId = useAuthStore((state) => state.coupleId);
  const loadSettings = useSettingsStore((state) => state.loadSettings);
  const appLockEnabled = useAuthStore((state) => state.appLockEnabled);
  const lockHydrated = usePinStore((state) => state.lockHydrated);
  const isUnlocked = usePinStore((state) => state.isUnlocked);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const deepLinkUrl = useURL();
  const handledDeepLinkRef = useRef<string | null>(null);

  useEffect(() => {
    void hydrateAppLockFromStorage().finally(() => {
      usePinStore.getState().setLockHydrated(true);
      if (useAuthStore.getState().appLockEnabled) {
        usePinStore.getState().resetUnlock();
      }
    });
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      const wasBackground = appStateRef.current.match(/inactive|background/);
      appStateRef.current = nextState;

      if (wasBackground && nextState === 'active' && useAuthStore.getState().appLockEnabled) {
        usePinStore.getState().resetUnlock();
      }
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    void (async () => {
      const active = await bootstrapPartnerMode();
      if (active) {
        log('[RootLayout] partner session restored');
      }
      setPartnerSessionChecked(true);
    })();
  }, []);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    void import('../src/firebase/auth').then(({ onAuthStateChanged }) => {
      unsubscribe = onAuthStateChanged((nextUser) => {
        setUser(nextUser);
        if (!useAuthStore.getState().isPartnerMode) {
          setAuthUser(nextUser);
        }
        if (!nextUser && !useAuthStore.getState().isPartnerMode) {
          setCoupleBootstrapped(false);
          setUserDocReady(false);
          setFirestoreOnboardingComplete(false);
        }
      });
    });

    return () => {
      unsubscribe?.();
    };
  }, [setAuthUser]);

  useEffect(() => {
    if (!partnerSessionChecked || isPartnerMode) {
      if (isPartnerMode) {
        setUserDocReady(true);
        setFirestoreOnboardingComplete(true);
        setCoupleBootstrapped(true);
      }
      return;
    }

    if (user === undefined) {
      return;
    }

    if (!user) {
      setUserDocReady(true);
      setFirestoreOnboardingComplete(false);
      setCoupleBootstrapped(true);
      return;
    }

    if (user.isAnonymous) {
      setUserDocReady(true);
      setFirestoreOnboardingComplete(true);
      setCoupleBootstrapped(true);
      return;
    }

    let cancelled = false;
    setUserDocReady(false);

    void (async () => {
      const doc = await getUserDocument(user.uid);
      if (cancelled) {
        return;
      }

      const complete = doc?.onboardingComplete === true;
      setFirestoreOnboardingComplete(complete);
      setUserDocReady(true);

      if (doc) {
        useAuthStore.getState().setUserProfile({
          firstName: doc.firstName,
          lastName: doc.lastName,
          country: doc.country,
          phone: doc.phone,
        });
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, partnerSessionChecked, isPartnerMode]);

  useEffect(() => {
    if (!partnerSessionChecked || isPartnerMode) {
      return;
    }

    if (!user?.uid || !userDocReady || !onboardingComplete) {
      if (!onboardingComplete) {
        setCoupleBootstrapped(true);
      }
      return;
    }

    let cancelled = false;
    setCoupleBootstrapped(false);

    log('[RootLayout] bootstrapping couple for onboarded user', {
      uid: user.uid,
    });

    void bootstrapCoupleForAuthUser(user.uid, user.email).finally(() => {
      if (!cancelled) {
        setCoupleBootstrapped(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [
    user?.uid,
    user?.email,
    isPartnerMode,
    partnerSessionChecked,
    userDocReady,
    onboardingComplete,
  ]);

  useEffect(() => {
    if (coupleId) {
      void loadSettings(coupleId);
    }
  }, [coupleId, loadSettings]);

  useEffect(() => {
    if (!deepLinkUrl || handledDeepLinkRef.current === deepLinkUrl) {
      return;
    }

    const parsed = Linking.parse(deepLinkUrl);
    const path = parsed.path ?? '';
    const host = parsed.hostname ?? '';
    if (!path.includes('invite') && host !== 'invite') {
      return;
    }

    handledDeepLinkRef.current = deepLinkUrl;

    const pathToken = path.split('/').filter(Boolean).pop();
    const queryToken = parsed.queryParams?.token;
    const token = (
      typeof pathToken === 'string' && pathToken.length > 0
        ? pathToken
        : typeof queryToken === 'string'
          ? queryToken
          : Array.isArray(queryToken)
            ? queryToken[0]
            : undefined
    )?.trim();

    if (!token) {
      return;
    }

    const queryPin = parsed.queryParams?.pin;
    const pin =
      typeof queryPin === 'string'
        ? queryPin
        : Array.isArray(queryPin)
          ? queryPin[0]
          : '';

    router.push({
      pathname: '/(app)/settings/couple',
      params: { inviteToken: token, invitePin: pin ?? '' },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deepLinkUrl]);

  useEffect(() => {
    if (!partnerSessionChecked || !userDocReady || !fontsLoaded) {
      return;
    }

    if (isPartnerMode) {
      const inAppGroup = segments[0] === '(app)';
      const onJoin = segments[0] === 'join';
      if (!inAppGroup && !onJoin) {
        router.replace('/calendar');
      }
      return;
    }

    if (user?.isAnonymous) {
      return;
    }

    if (user === undefined) {
      return;
    }

    if (user && !coupleBootstrapped) {
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';
    const inAppGroup = segments[0] === '(app)';
    const inOnboarding = segments[0] === 'onboarding';
    const onJoin = segments[0] === 'join';
    const onInvite = segments[0] === 'invite';

    if (!user) {
      if (inAuthGroup || inOnboarding || onJoin || onInvite) {
        return;
      }
      router.replace('/(auth)/beta-gate');
      return;
    }

    if (!onboardingComplete) {
      if (inOnboarding) {
        return;
      }
      router.replace('/onboarding/welcome');
      return;
    }

    if (inOnboarding) {
      router.replace('/calendar');
      return;
    }

    if (!inAppGroup && segments[0] !== 'invite') {
      router.replace('/calendar');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    user?.uid,
    onboardingComplete,
    coupleBootstrapped,
    segments[0],
    isPartnerMode,
    partnerSessionChecked,
    userDocReady,
    fontsLoaded,
  ]);

  const isAuthLoading = !isPartnerMode && user === undefined;
  const isBootstrapping =
    (!fontsLoaded && !webFontsReady) ||
    !partnerSessionChecked ||
    isAuthLoading ||
    (!isPartnerMode && !!user && !userDocReady) ||
    (!isPartnerMode && !!user && onboardingComplete && !coupleBootstrapped);
  const inAuthGroup = segments[0] === '(auth)';
  const inAppGroup = segments[0] === '(app)';
  const inOnboarding = segments[0] === 'onboarding';
  const onJoin = segments[0] === 'join';
  const onInvite = segments[0] === 'invite';

  const showPartnerRedirect =
    !isBootstrapping && isPartnerMode && !inAppGroup && !onJoin;
  const showLoggedOutRedirect =
    !isBootstrapping &&
    !isPartnerMode &&
    !user &&
    !inAuthGroup &&
    !inOnboarding &&
    !onJoin &&
    !onInvite;
  const showLoggedInIncompleteRedirect =
    !isBootstrapping &&
    !isPartnerMode &&
    !!user &&
    !onboardingComplete &&
    !inOnboarding;
  const showLoggedInCompleteRedirect =
    !isBootstrapping &&
    !isPartnerMode &&
    !!user &&
    onboardingComplete &&
    !inAppGroup &&
    !onInvite;

  const hasProtectedSession =
    isPartnerMode || (!!user && onboardingComplete && !user.isAnonymous);
  const showAppLockOverlay =
    lockHydrated &&
    appLockEnabled &&
    !isUnlocked &&
    hasProtectedSession &&
    inAppGroup;
  const showLockHydrationVeil =
    !lockHydrated && hasProtectedSession && inAppGroup;

  if (!fontsLoaded && !webFontsReady) {
    return (
      <View style={styles.fontLoading}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <DesktopWebShell>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="join" options={{ headerShown: false }} />
          <Stack.Screen name="invite/[code]" options={{ headerShown: false }} />
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
        {showPartnerRedirect ? <Redirect href="/calendar" /> : null}
        {showLoggedOutRedirect ? (
          <Redirect href="/(auth)/beta-gate" />
        ) : null}
        {showLoggedInIncompleteRedirect ? (
          <Redirect href="/onboarding/welcome" />
        ) : null}
        {showLoggedInCompleteRedirect ? (
          <Redirect href="/calendar" />
        ) : null}
        <Toast />
        <DeleteAccountLoadingOverlay />
        {showLockHydrationVeil ? <View style={styles.lockHydrationVeil} /> : null}
        <AppLockGate visible={showAppLockOverlay} />
      </DesktopWebShell>
    </GestureHandlerRootView>
  );
}

export default RootLayout;

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  fontLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
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
  lockHydrationVeil: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#fff',
    zIndex: 9999,
  },
});
