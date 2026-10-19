import * as Location from 'expo-location';
import { Stack } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { City } from '../../../src/constants/cities';
import { useDesktopWeb } from '../../../src/hooks/useDesktopWeb';
import { useSettingsSaved } from '../../../src/hooks/useSettingsSaved';
import {
  resolveZmanimLocation,
  roundCoordinate,
  useZmanimLocationStore,
} from '../../../src/store/zmanimLocationStore';
import { inputStartStyle, textStartStyle, useAlignStart } from '../../../src/utils/rtl';
import { webScreenScrollStyles } from '../../../src/utils/webScroll';
import { allCities, formatTime, onahBounds } from '../../../src/utils/zmanim';
import { formatGregorianLocal } from '../../../src/calculations/onah';

function deviceTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Jerusalem';
  } catch {
    return 'Asia/Jerusalem';
  }
}

/** Where sunset and sunrise are calculated. Saved on this device only. */
export default function LocationScreen() {
  const { t, i18n } = useTranslation();
  const isDesktopWeb = useDesktopWeb();
  const webScroll = webScreenScrollStyles();
  const textAlign = useAlignStart();
  const settingsSaved = useSettingsSaved();
  const choice = useZmanimLocationStore((state) => state.choice);
  const setChoice = useZmanimLocationStore((state) => state.setChoice);
  const [query, setQuery] = useState('');
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const resolved = resolveZmanimLocation(choice);
  const cityName = (city: City) => (i18n.language === 'he' ? city.he : city.en);

  const today = formatGregorianLocal(new Date());
  const todayBounds = onahBounds({ dateGregorian: today, onah: 'day' }, resolved.place);

  const cities = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allCities().filter(
      (city) => !q || city.he.includes(q) || city.en.toLowerCase().includes(q),
    );
  }, [query]);

  async function chooseCity(city: City) {
    await setChoice({ kind: 'city', cityId: city.id });
    setQuery('');
    settingsSaved();
  }

  async function locateDevice() {
    setLocationError(null);
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError(t('location.permissionDenied'));
        return;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      await setChoice({
        kind: 'device',
        latitude: roundCoordinate(position.coords.latitude),
        longitude: roundCoordinate(position.coords.longitude),
        tzid: deviceTimeZone(),
      });
      settingsSaved();
    } catch {
      setLocationError(t('location.failed'));
    } finally {
      setLocating(false);
    }
  }

  const current = resolved.city
    ? resolved.isDefault
      ? t('location.currentDefault', { city: cityName(resolved.city) })
      : cityName(resolved.city)
    : t('location.currentDevice');

  const body = (
    <ScrollView style={webScroll.scroll} contentContainerStyle={styles.scroll}>
      <Text style={[styles.description, textStartStyle()]}>{t('location.description')}</Text>

      <View style={styles.currentCard}>
        <Text style={[styles.currentLabel, textStartStyle()]}>{t('location.current')}</Text>
        <Text style={[styles.currentValue, textStartStyle()]}>{current}</Text>
        <Text style={[styles.description, textStartStyle()]}>
          {t('location.todayTimes', {
            sunrise: formatTime(todayBounds.start),
            sunset: formatTime(todayBounds.end),
          })}
        </Text>
      </View>

      <Pressable
        style={[styles.deviceButton, locating && styles.disabled]}
        onPress={() => void locateDevice()}
        disabled={locating}
      >
        {locating ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.deviceButtonText}>{t('location.useDevice')}</Text>
        )}
      </Pressable>
      <Text style={[styles.privacy, textStartStyle()]}>{t('location.privacy')}</Text>
      {locationError ? (
        <Text style={[styles.error, textStartStyle()]}>{locationError}</Text>
      ) : null}

      <Text style={[styles.sectionLabel, textStartStyle()]}>{t('location.chooseCity')}</Text>
      <TextInput
        style={[styles.search, inputStartStyle(), { textAlign }]}
        value={query}
        onChangeText={setQuery}
        placeholder={t('location.search')}
        textAlign={textAlign}
      />
      <View style={styles.list}>
        {cities.map((city) => {
          const selected = choice?.kind === 'city' && choice.cityId === city.id;
          return (
            <Pressable
              key={city.id}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              style={[styles.cityRow, selected && styles.cityRowSelected]}
              onPress={() => void chooseCity(city)}
            >
              <Text style={[styles.cityText, selected && styles.cityTextSelected, textStartStyle()]}>
                {cityName(city)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );

  if (isDesktopWeb) {
    return <View style={styles.safe}>{body}</View>;
  }

  return (
    <>
      <Stack.Screen options={{ title: t('location.title') }} />
      <SafeAreaView style={[styles.safe, webScroll.safe]} edges={['bottom']}>
        {body}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  scroll: { padding: 20, paddingBottom: 32, gap: 12 },
  description: { fontSize: 14, lineHeight: 20, color: '#666' },
  currentCard: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e5e5',
    backgroundColor: '#fafafa',
    padding: 16,
    gap: 4,
  },
  currentLabel: { fontSize: 13, color: '#888', fontWeight: '600' },
  currentValue: { fontSize: 18, fontWeight: '700' },
  deviceButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  deviceButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  disabled: { opacity: 0.6 },
  privacy: { fontSize: 13, lineHeight: 18, color: '#888' },
  error: { fontSize: 14, color: '#b91c1c' },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: '#888', marginTop: 12 },
  search: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  list: { gap: 2 },
  cityRow: { paddingVertical: 12, paddingHorizontal: 12, borderRadius: 8 },
  cityRowSelected: { backgroundColor: '#1a1a1a' },
  cityText: { fontSize: 16 },
  cityTextSelected: { color: '#fff', fontWeight: '600' },
});
