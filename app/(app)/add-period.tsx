import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PeriodForm } from '../../src/components/period/PeriodForm';
import { WebMainContent } from '../../src/components/web/WebMainContent';
import { DESKTOP_ADD_PERIOD_MAX_WIDTH } from '../../src/constants/layout';
import { useDesktopWeb } from '../../src/hooks/useDesktopWeb';
import { textStartStyle } from '../../src/utils/rtl';
import { webScreenScrollStyles } from '../../src/utils/webScroll';

export default function AddPeriodScreen() {
  const { t } = useTranslation();
  const isDesktopWeb = useDesktopWeb();
  const webScroll = webScreenScrollStyles();

  const form = (
    <>
      <Text style={[styles.title, textStartStyle()]}>{t('period.add')}</Text>
      <PeriodForm />
    </>
  );

  if (isDesktopWeb) {
    return (
      <WebMainContent centered maxWidth={DESKTOP_ADD_PERIOD_MAX_WIDTH}>
        <View style={styles.desktopCard}>{form}</View>
      </WebMainContent>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, webScroll.safe]} edges={['top']}>
      <ScrollView
        style={webScroll.scroll}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {form}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scroll: {
    padding: 20,
    paddingBottom: 40,
  },
  desktopCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e5e5',
    padding: 32,
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 24,
  },
});
