import { Icon } from '@/components/common/Icon';
import { Tabs, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState, Platform, StyleSheet, View } from 'react-native';

import { NotificationScheduler } from '../../src/components/app/NotificationScheduler';
import { PartnerModeBanner } from '../../src/components/common/PartnerModeBanner';
import { WebAppShell } from '../../src/components/web/WebAppShell';
import { signOut } from '../../src/firebase/auth';
import { checkPartnerAccessValid } from '../../src/firebase/firestore';
import { useCouple } from '../../src/hooks/useCouple';
import { useDesktopWeb } from '../../src/hooks/useDesktopWeb';
import { usePeriods } from '../../src/hooks/usePeriods';
import { useAuthStore } from '../../src/store/authStore';
import { clearPartnerSession } from '../../src/utils/partnerSession';

const CoupleDebugOverlay = __DEV__
  ? require('../../src/components/dev/CoupleDebugOverlay').default
  : null;

export default function AppLayout() {
  const { t } = useTranslation();
  const router = useRouter();
  const isDesktopWeb = useDesktopWeb();
  usePeriods();
  useCouple();

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active') {
        return;
      }

      void (async () => {
        const { isPartnerMode: partnerMode, ownerUserId: ownerId } =
          useAuthStore.getState();
        if (partnerMode && ownerId) {
          const valid = await checkPartnerAccessValid(ownerId);
          if (!valid) {
            await clearPartnerSession();
            useAuthStore.getState().setPartnerMode(false, null, null);
            useAuthStore.getState().setCoupleId(null);
            const { useOnboardingStore } = await import('../../src/store/onboardingStore');
            useOnboardingStore.getState().reset();
            await signOut();
            router.replace('/onboarding/welcome');
          }
        }
      })();
    });

    return () => subscription.remove();
  }, [router]);

  return (
    <>
      <NotificationScheduler />
      <WebAppShell>
        <View style={styles.tabsHost}>
          <PartnerModeBanner />
          <Tabs
            screenOptions={{
              headerShown: false,
              lazy: true,
              tabBarHideOnKeyboard: false,
              tabBarShowLabel: true,
              tabBarActiveTintColor: '#1a1a1a',
              tabBarInactiveTintColor: '#999999',
              tabBarLabelStyle: {
                fontSize: 12,
              },
              tabBarStyle: isDesktopWeb
                ? styles.tabBarHidden
                : Platform.select({
                    android: {
                      borderTopColor: '#e5e5e5',
                      borderTopWidth: StyleSheet.hairlineWidth,
                      elevation: 8,
                    },
                    default: {
                      borderTopColor: '#e5e5e5',
                      borderTopWidth: StyleSheet.hairlineWidth,
                    },
                  }),
            }}
          >
            <Tabs.Screen
              name="calendar"
              options={{
                title: t('navigation.calendar'),
                tabBarIcon: ({ color, size }) => (
                  <Icon name="calendar" size={size} color={color} />
                ),
              }}
            />
            <Tabs.Screen
              name="upcoming"
              options={{
                title: t('navigation.upcoming'),
                href: isDesktopWeb ? null : undefined,
                tabBarIcon: ({ color, size }) => (
                  <Icon name="list" size={size} color={color} />
                ),
              }}
            />
            <Tabs.Screen
              name="edit-period/[id]"
              options={{
                href: null,
              }}
            />
            <Tabs.Screen
              name="add-period"
              options={{
                title: t('navigation.add'),
                tabBarIcon: ({ color, size }) => (
                  <Icon name="plus-circle" size={size} color={color} />
                ),
              }}
            />
            <Tabs.Screen
              name="add-period-preview"
              options={{
                href: null,
              }}
            />
            <Tabs.Screen
              name="settings"
              options={{
                title: t('navigation.settings'),
                tabBarIcon: ({ color, size }) => (
                  <Icon name="settings" size={size} color={color} />
                ),
              }}
            />
          </Tabs>
        </View>
      </WebAppShell>
      {__DEV__ && <CoupleDebugOverlay />}
    </>
  );
}

const styles = StyleSheet.create({
  tabsHost: {
    flex: 1,
    minWidth: 0,
  },
  tabBarHidden: {
    display: 'none',
    height: 0,
  },
});
