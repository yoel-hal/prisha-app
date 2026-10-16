import {
  BannerEditor,
  type BannerEditorPreviewState,
} from '@/components/admin/BannerEditor';
import { BannerContent } from '@/components/common/AppBanner';
import { log } from '@/utils/log';
import { textStartStyle } from '@/utils/rtl';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const DEFAULT_PREVIEW: BannerEditorPreviewState = {
  titleHe: '',
  titleEn: '',
  bodyHe: '',
  bodyEn: '',
  ctaTextHe: '',
  ctaTextEn: '',
  ctaUrl: '',
  activeTab: 'he',
  isActive: true,
};

export default function AdminBannerScreen() {
  const { t } = useTranslation();
  const [previewState, setPreviewState] =
    useState<BannerEditorPreviewState>(DEFAULT_PREVIEW);

  useEffect(() => {
    log('[AdminBannerScreen] enter');
    return () => {
      log('[AdminBannerScreen] exit');
    };
  }, []);

  const handlePreviewChange = useCallback((state: BannerEditorPreviewState) => {
    setPreviewState(state);
  }, []);

  const previewContent = useMemo(() => {
    const isHebrew = previewState.activeTab === 'he';
    return {
      title: isHebrew ? previewState.titleHe : previewState.titleEn,
      body: isHebrew ? previewState.bodyHe : previewState.bodyEn,
      ctaText: isHebrew ? previewState.ctaTextHe : previewState.ctaTextEn,
      ctaUrl: previewState.ctaUrl,
    };
  }, [previewState]);

  return (
    <SafeAreaView className="flex-1 bg-neutral-50" edges={['top', 'bottom']}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-6 p-4 pb-10"
        keyboardShouldPersistTaps="handled"
      >
        <Text
          className="text-2xl font-bold text-neutral-900"
          style={textStartStyle()}
        >
          {t('admin.banner.title')}
        </Text>

        <BannerEditor onPreviewChange={handlePreviewChange} />

        <View className="gap-4">
          <Text
            className="text-lg font-semibold text-neutral-900"
            style={textStartStyle()}
          >
            {t('admin.banner.preview')}
          </Text>

          <View className="gap-2">
            <Text className="text-sm text-neutral-600" style={textStartStyle()}>
              Mobile
            </Text>
            <View style={styles.mobileFrame}>
              <View style={styles.mobileCanvas}>
                <BannerContent
                  title={previewContent.title || '—'}
                  body={previewContent.body || '—'}
                  ctaText={previewContent.ctaText}
                  ctaUrl={previewContent.ctaUrl}
                  layout="mobile"
                />
              </View>
            </View>
          </View>

          <View className="gap-2">
            <Text className="text-sm text-neutral-600" style={textStartStyle()}>
              Web
            </Text>
            <View style={styles.webFrame}>
              <BannerContent
                title={previewContent.title || '—'}
                body={previewContent.body || '—'}
                ctaText={previewContent.ctaText}
                ctaUrl={previewContent.ctaUrl}
                layout="web"
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mobileFrame: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#d4d4d4',
    backgroundColor: '#f5f5f5',
    overflow: 'hidden',
    height: 220,
  },
  mobileCanvas: {
    flex: 1,
    position: 'relative',
    justifyContent: 'flex-end',
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  webFrame: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#d4d4d4',
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
});
