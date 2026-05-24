import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState, Platform, StyleSheet, View, type AppStateStatus } from 'react-native';

import { NotificationScheduler } from '../../src/components/app/NotificationScheduler';
import { AppLockGate } from '../../src/components/common/AppLockGate';
import CoupleDebugOverlay from '../../src/components/dev/CoupleDebugOverlay';
import { PendingInviteGlobalBanner } from '../../src/components/couple/PendingInviteGlobalBanner';
import { SettingsTabIcon } from '../../src/components/couple/SettingsTabIcon';
import { WebAppShell } from '../../src/components/web/WebAppShell';
import { hydrateAppLockFromStorage } from '../../src/hooks/useAppLock';
import { useCouple } from '../../src/hooks/useCouple';
import { useDesktopWeb } from '../../src/hooks/useDesktopWeb';
import { usePeriods } from '../../src/hooks/usePeriods';
import { useAuthStore } from '../../src/store/authStore';

export default function AppLayout() {
  const { t } = useTranslation();
  const isDesktopWeb = useDesktopWeb();
  const setIsAppLocked = useAuthStore((state) => state.setIsAppLocked);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  usePeriods();
  useCouple();

  useEffect(() => {
    void hydrateAppLockFromStorage();
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextState === 'active' &&
        useAuthStore.getState().appLockEnabled
      ) {
        setIsAppLocked(true);
      }
      appStateRef.current = nextState;
    });

    return () => subscription.remove();
  }, [setIsAppLocked]);

  return (
    <AppLockGate>
      <NotificationScheduler />
      <WebAppShell>
        <View style={styles.tabsHost}>
          <PendingInviteGlobalBanner />
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
                  <Feather name="calendar" size={size} color={color} />
                ),
              }}
            />
            <Tabs.Screen
              name="add-period"
              options={{
                title: t('navigation.add'),
                tabBarIcon: ({ color, size }) => (
                  <Feather name="plus-circle" size={size} color={color} />
                ),
              }}
            />
            <Tabs.Screen
              name="settings"
              options={{
                title: t('navigation.settings'),
                tabBarIcon: ({ color, size }) => (
                  <SettingsTabIcon color={color} size={size} />
                ),
              }}
            />
          </Tabs>
        </View>
      </WebAppShell>
      {__DEV__ && <CoupleDebugOverlay />}
    </AppLockGate>
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
