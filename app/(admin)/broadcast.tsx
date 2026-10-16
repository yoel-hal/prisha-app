import { BroadcastComposer } from '@/components/admin/BroadcastComposer';
import { BroadcastHistory } from '@/components/admin/BroadcastHistory';
import { log } from '@/utils/log';
import { textStartStyle } from '@/utils/rtl';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AdminBroadcastScreen() {
  const { t } = useTranslation();

  useEffect(() => {
    log('[AdminBroadcastScreen] enter');
    return () => {
      log('[AdminBroadcastScreen] exit');
    };
  }, []);

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
          {t('admin.broadcast.title')}
        </Text>

        <BroadcastComposer />

        <View className="gap-3">
          <Text
            className="text-lg font-semibold text-neutral-900"
            style={textStartStyle()}
          >
            {t('admin.broadcast.history')}
          </Text>
          <BroadcastHistory />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
