import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet, View } from 'react-native';

import { NotificationScheduler } from '../../src/components/app/NotificationScheduler';
import { WebAppShell } from '../../src/components/web/WebAppShell';
import { useDesktopWeb } from '../../src/hooks/useDesktopWeb';
import { usePeriods } from '../../src/hooks/usePeriods';

export default function AppLayout() {
  const { t } = useTranslation();
  const isDesktopWeb = useDesktopWeb();
  usePeriods();

  return (
    <>
      <NotificationScheduler />
      <WebAppShell>
        <View style={styles.tabsHost}>
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
                  <Feather name="settings" size={size} color={color} />
                ),
              }}
            />
          </Tabs>
        </View>
      </WebAppShell>
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
