import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { SupportedLanguage } from '../../src/i18n';
import { PeriodPreviewVesetCard } from '../../src/components/period/PeriodPreviewVesetCard';
import { WebMainContent } from '../../src/components/web/WebMainContent';
import { DESKTOP_ADD_PERIOD_MAX_WIDTH } from '../../src/constants/layout';
import { useDesktopWeb } from '../../src/hooks/useDesktopWeb';
import { usePeriodPreviewVesetim } from '../../src/hooks/usePeriodPreviewVesetim';
import { useSavePeriodDraft } from '../../src/hooks/useSavePeriodDraft';
import {
  usePeriodDraftStore,
  type PeriodDraft,
} from '../../src/store/periodDraftStore';
import { formatGregorianDisplay } from '../../src/utils/formatGregorianDisplay';
import { formatHebrewDate } from '../../src/utils/hebrewDateFormat';
import { textStartStyle } from '../../src/utils/rtl';
import { showToast } from '../../src/utils/toast';
import { webScreenScrollStyles } from '../../src/utils/webScroll';

export default function AddPeriodPreviewScreen() {
  const router = useRouter();
  const draft = usePeriodDraftStore((state) => state.draft);

  useEffect(() => {
    if (!draft) {
      router.replace('/(app)/add-period');
    }
  }, [draft, router]);

  if (!draft) {
    return null;
  }

  return <AddPeriodPreviewContent draft={draft} />;
}

function AddPeriodPreviewContent({ draft }: { draft: PeriodDraft }) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const isDesktopWeb = useDesktopWeb();
  const webScroll = webScreenScrollStyles();
  const language = i18n.language as SupportedLanguage;
  const vesetim = usePeriodPreviewVesetim(draft);
  const { save, isSaving } = useSavePeriodDraft();

  async function handleSave() {
    const ok = await save();
    if (!ok) {
      return;
    }
    showToast(t('period.saved'));
    router.replace('/(app)/calendar');
  }

  const content = (
    <>
      <Text style={[styles.title, textStartStyle()]}>{t('period.previewTitle')}</Text>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, textStartStyle()]}>
          {t('period.sectionPeriodDay')}
        </Text>
        <View style={styles.periodCard}>
          <Text style={[styles.periodHebrew, textStartStyle()]}>
            {formatHebrewDate(draft.dateHebrew, language)}
          </Text>
          <Text style={[styles.periodGregorian, textStartStyle()]}>
            {formatGregorianDisplay(draft.dateGregorian, language)}
          </Text>
          <View style={styles.onahBadge}>
            <Text style={styles.onahBadgeText}>
              {t(draft.onah === 'day' ? 'period.day' : 'period.night')}
            </Text>
          </View>
          {draft.notes.trim() ? (
            <Text style={[styles.notes, textStartStyle()]}>{draft.notes.trim()}</Text>
          ) : null}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, textStartStyle()]}>
          {t('period.sectionUpcoming')}
        </Text>
        <View style={styles.vesetCards}>
          <PeriodPreviewVesetCard
            type="onahBeinonit"
            results={vesetim.onahBeinonit}
          />
          <PeriodPreviewVesetCard
            type="haflaga"
            results={vesetim.haflaga}
            notEnoughDataLabel={t('period.haflagaNotEnoughData')}
          />
          <PeriodPreviewVesetCard
            type="yomHaChodesh"
            results={vesetim.yomHaChodesh}
          />
        </View>
      </View>

      <View style={styles.footer}>
        <Pressable
          style={styles.editButton}
          onPress={() => router.back()}
          disabled={isSaving}
        >
          <Text style={styles.editButtonText}>{t('period.backToEdit')}</Text>
        </Pressable>
        <Pressable
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={() => void handleSave()}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>{t('period.saveConfirm')}</Text>
          )}
        </Pressable>
      </View>
    </>
  );

  if (isDesktopWeb) {
    return (
      <WebMainContent centered maxWidth={DESKTOP_ADD_PERIOD_MAX_WIDTH}>
        <View style={styles.desktopCard}>{content}</View>
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
        {content}
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
  section: {
    gap: 12,
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
  },
  periodCard: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e5e5',
    padding: 20,
    gap: 8,
    backgroundColor: '#fff',
  },
  periodHebrew: {
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 34,
  },
  periodGregorian: {
    fontSize: 16,
    color: '#555',
  },
  onahBadge: {
    alignSelf: 'flex-start',
    marginTop: 4,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  onahBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  notes: {
    marginTop: 8,
    fontSize: 15,
    color: '#444',
    lineHeight: 22,
  },
  vesetCards: {
    gap: 12,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  editButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ccc',
    backgroundColor: '#fff',
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
