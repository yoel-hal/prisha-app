import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { UpcomingVesetimFullList } from '../../src/components/calendar/UpcomingVesetimFullList';
import { WebMainContent } from '../../src/components/web/WebMainContent';
import { useDesktopWeb } from '../../src/hooks/useDesktopWeb';
import { usePeriods } from '../../src/hooks/usePeriods';
import { useVesetCalculations } from '../../src/hooks/useVesetCalculations';
import { usePeriodsStore } from '../../src/store/periodsStore';
import { textStartStyle } from '../../src/utils/rtl';

export default function UpcomingScreen() {
  const { t } = useTranslation();
  const isDesktopWeb = useDesktopWeb();
  usePeriods();
  const { vesetim } = useVesetCalculations();
  const periods = usePeriodsStore((state) => state.periods);

  const body = (
    <>
      <Text style={[styles.title, textStartStyle()]}>{t('calendar.upcomingVesetim')}</Text>
      <UpcomingVesetimFullList vesetim={vesetim} periods={periods} />
    </>
  );

  if (isDesktopWeb) {
    return (
      <WebMainContent>
        <View style={styles.desktopCard}>{body}</View>
      </WebMainContent>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.content}>{body}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
    gap: 16,
  },
  desktopCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e5e5',
    padding: 24,
    gap: 16,
    minHeight: 400,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
});
