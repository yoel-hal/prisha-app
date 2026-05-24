import { Feather } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { isAppRTL, textStartStyle } from '../../../src/utils/rtl';
import { webScreenScrollStyles } from '../../../src/utils/webScroll';

const GITHUB_URL = 'https://github.com';
const PRIVACY_EMAIL = 'privacy@prisha-app.com';

const PRIVACY_SECTIONS = [
  { titleKey: 'about.dataWeCollectTitle', bodyKey: 'about.dataWeCollectBody' },
  { titleKey: 'about.dataStorageTitle', bodyKey: 'about.dataStorageBody' },
  { titleKey: 'about.periodDataTitle', bodyKey: 'about.periodDataBody' },
  { titleKey: 'about.noAdsTitle', bodyKey: 'about.noAdsBody' },
  { titleKey: 'about.deleteAccountTitle', bodyKey: 'about.deleteAccountBody' },
] as const;

export default function AboutSettingsScreen() {
  const { t } = useTranslation();
  const webScroll = webScreenScrollStyles();
  const appVersion = Constants.expoConfig?.version ?? '—';

  return (
    <>
      <Stack.Screen options={{ title: t('settings.about') }} />
      <SafeAreaView style={[styles.safe, webScroll.safe]} edges={['bottom']}>
        <ScrollView
          style={[styles.scroll, webScroll.scroll]}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.group}>
            <LinkRow
              label={t('about.github')}
              onPress={() => void Linking.openURL(GITHUB_URL)}
            />
            <View style={[styles.row, styles.rowLast]}>
              <Text style={[styles.rowLabel, textStartStyle()]}>
                {t('about.version')}
              </Text>
              <Text style={styles.rowValue}>{appVersion}</Text>
            </View>
          </View>

          <Text style={[styles.privacyHeading, textStartStyle()]}>
            {t('about.privacyPolicy')}
          </Text>

          {PRIVACY_SECTIONS.map((section) => (
            <View key={section.titleKey} style={styles.policySection}>
              <Text style={[styles.sectionTitle, textStartStyle()]}>
                {t(section.titleKey)}
              </Text>
              <Text style={[styles.sectionBody, textStartStyle()]}>
                {t(section.bodyKey)}
              </Text>
            </View>
          ))}

          <View style={styles.policySection}>
            <Text style={[styles.sectionTitle, textStartStyle()]}>
              {t('about.contactTitle')}
            </Text>
            <Text style={[styles.sectionBody, textStartStyle()]}>
              {t('about.contactIntro')}{' '}
              <Text
                style={styles.link}
                onPress={() =>
                  void Linking.openURL(`mailto:${PRIVACY_EMAIL}`)
                }
                accessibilityRole="link"
              >
                {PRIVACY_EMAIL}
              </Text>
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

function LinkRow({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={styles.row}
      onPress={onPress}
      accessibilityRole="link"
    >
      <Text style={[styles.rowLabel, textStartStyle()]}>{label}</Text>
      <Feather
        name={isAppRTL() ? 'chevron-left' : 'chevron-right'}
        size={20}
        color="#999"
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 32,
    gap: 20,
  },
  group: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e5e5',
    borderRadius: 12,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowLabel: {
    fontSize: 16,
    flex: 1,
  },
  rowValue: {
    fontSize: 16,
    color: '#6b7280',
  },
  privacyHeading: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 4,
  },
  policySection: {
    gap: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  sectionBody: {
    fontSize: 15,
    lineHeight: 22,
    color: '#4b5563',
  },
  link: {
    color: '#4A90D9',
    textDecorationLine: 'underline',
  },
});
