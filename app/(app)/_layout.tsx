import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet } from 'react-native';

import { NotificationScheduler } from '../../src/components/app/NotificationScheduler';
import { usePeriods } from '../../src/hooks/usePeriods';

export default function AppLayout() {
  const { t } = useTranslation();
  usePeriods();

  return (
    <>
    <NotificationScheduler />
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
        tabBarStyle: Platform.select({
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
    </>
  );
}
