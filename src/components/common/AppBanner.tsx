import { Icon } from '@/components/common/Icon';
import { useAppBanner } from '@/hooks/useAppBanner';
import { useDesktopWeb } from '@/hooks/useDesktopWeb';
import { log } from '@/utils/log';
import { textStartStyle } from '@/utils/rtl';
import * as WebBrowser from 'expo-web-browser';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';

export interface BannerContentProps {
  title: string;
  body: string;
  ctaText?: string | null;
  ctaUrl?: string | null;
  onDismiss?: () => void;
  onCtaPress?: () => void;
  layout?: 'mobile' | 'web' | 'auto';
}

function resolveLayout(
  layout: BannerContentProps['layout'],
  isDesktopWeb: boolean,
): 'mobile' | 'web' {
  if (layout === 'mobile' || layout === 'web') {
    return layout;
  }
  return isDesktopWeb ? 'web' : 'mobile';
}

export function BannerContent({
  title,
  body,
  ctaText,
  ctaUrl,
  onDismiss,
  onCtaPress,
  layout = 'auto',
}: BannerContentProps) {
  const { t } = useTranslation();
  const isDesktopWeb = useDesktopWeb();
  const resolvedLayout = resolveLayout(layout, isDesktopWeb);
  const showCta = Boolean(ctaText?.trim() && ctaUrl?.trim());

  const handleCtaPress = () => {
    if (onCtaPress) {
      onCtaPress();
      return;
    }

    const url = ctaUrl?.trim();
    if (!url) {
      return;
    }

    void WebBrowser.openBrowserAsync(url);
  };

  if (resolvedLayout === 'web') {
    return (
      <View style={styles.webBanner}>
        <View style={styles.webContent}>
          <View style={styles.webTextBlock}>
            <Text style={[styles.webTitle, textStartStyle()]}>{title}</Text>
            <Text style={[styles.webBody, textStartStyle()]}>{body}</Text>
          </View>
          {showCta ? (
            <Pressable
              onPress={handleCtaPress}
              style={styles.webCta}
              accessibilityRole="button"
            >
              <Text style={styles.webCtaText}>
                {ctaText?.trim() || t('app.banner.learnMore')}
              </Text>
            </Pressable>
          ) : null}
        </View>
        {onDismiss ? (
          <Pressable
            onPress={onDismiss}
            style={styles.closeButton}
            accessibilityRole="button"
            accessibilityLabel={t('app.banner.close')}
            hitSlop={8}
          >
            <Icon name="x" size={18} color="#525252" />
          </Pressable>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.mobileCard}>
      {onDismiss ? (
        <Pressable
          onPress={onDismiss}
          style={styles.closeButton}
          accessibilityRole="button"
          accessibilityLabel={t('app.banner.close')}
          hitSlop={8}
        >
          <Icon name="x" size={18} color="#525252" />
        </Pressable>
      ) : null}
      <Text style={[styles.mobileTitle, textStartStyle()]}>{title}</Text>
      <Text style={[styles.mobileBody, textStartStyle()]}>{body}</Text>
      {showCta ? (
        <Pressable
          onPress={handleCtaPress}
          style={styles.mobileCta}
          accessibilityRole="button"
        >
          <Text style={styles.mobileCtaText}>
            {ctaText?.trim() || t('app.banner.learnMore')}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function AppBanner() {
  const { banner, dismiss } = useAppBanner();
  const { i18n } = useTranslation();
  const isDesktopWeb = useDesktopWeb();

  useEffect(() => {
    log('[AppBanner] enter');
    return () => {
      log('[AppBanner] exit');
    };
  }, []);

  if (!banner) {
    return null;
  }

  const isEnglish = i18n.language === 'en';
  const title = isEnglish ? banner.titleEn : banner.titleHe;
  const body = isEnglish ? banner.bodyEn : banner.bodyHe;
  const ctaText = isEnglish ? banner.ctaTextEn : banner.ctaTextHe;

  if (isDesktopWeb) {
    return (
      <View style={styles.webHost} pointerEvents="box-none">
        <BannerContent
          title={title}
          body={body}
          ctaText={ctaText}
          ctaUrl={banner.ctaUrl}
          onDismiss={dismiss}
          layout="web"
        />
      </View>
    );
  }

  return (
    <View style={styles.mobileHost} pointerEvents="box-none">
      <BannerContent
        title={title}
        body={body}
        ctaText={ctaText}
        ctaUrl={banner.ctaUrl}
        onDismiss={dismiss}
        layout="mobile"
      />
    </View>
  );
}

const webHost: ViewStyle =
  Platform.OS === 'web'
    ? ({
        position: 'fixed',
        bottom: 0,
        start: 0,
        end: 0,
        zIndex: 50,
      } as unknown as ViewStyle)
    : {
        position: 'absolute',
        bottom: 0,
        start: 0,
        end: 0,
        zIndex: 50,
      };

const styles = StyleSheet.create({
  mobileHost: {
    position: 'absolute',
    bottom: 80,
    start: 16,
    end: 16,
    zIndex: 50,
  },
  webHost,
  mobileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingTop: 16,
    paddingBottom: 16,
    paddingStart: 16,
    paddingEnd: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e5e5',
  },
  mobileTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#171717',
    marginBottom: 6,
  },
  mobileBody: {
    fontSize: 14,
    lineHeight: 20,
    color: '#404040',
  },
  mobileCta: {
    alignSelf: 'flex-start',
    marginTop: 12,
    backgroundColor: '#171717',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  mobileCtaText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  webBanner: {
    backgroundColor: '#ffffff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e5e5e5',
    paddingHorizontal: 24,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  webContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    flexWrap: 'wrap',
  },
  webTextBlock: {
    flex: 1,
    minWidth: 200,
    gap: 4,
  },
  webTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#171717',
  },
  webBody: {
    fontSize: 14,
    lineHeight: 20,
    color: '#404040',
  },
  webCta: {
    backgroundColor: '#171717',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  webCtaText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    end: 10,
    padding: 4,
  },
});
