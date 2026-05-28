import '../global.css';

import { useFonts } from 'expo-font';
import { Redirect, Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import type { User } from 'firebase/auth';

import { DesktopWebShell } from '../src/components/common/DesktopWebShell';
import '../src/i18n';
import { getUserDocument } from '../src/firebase/firestore';
import {
  bootstrapCoupleForAuthUser,
  bootstrapPartnerMode,
} from '../src/hooks/useCouple';  
import { useAuthStore } from '../src/store/authStore';
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
  }, [user?.uid, partnerSessionChecked, isPartnerMode, user, setFirestoreOnboardingComplete]);

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

    if (!user) {
      if (inAuthGroup || inOnboarding || onJoin) {
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

    if (!inAppGroup) {
      router.replace('/calendar');
    }
  }, [
    user,
    onboardingComplete,
    coupleBootstrapped,
    segments,
    router,
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

  const showPartnerRedirect =
    !isBootstrapping && isPartnerMode && !inAppGroup && !onJoin;
  const showLoggedOutRedirect =
    !isBootstrapping &&
    !isPartnerMode &&
    !user &&
    !inAuthGroup &&
    !inOnboarding &&
    !onJoin;
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
    !inAppGroup;

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
});
