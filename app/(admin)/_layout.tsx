import { PinModal } from '@/components/admin/PinModal';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { log } from '@/utils/log';
import { Slot } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

export default function AdminLayout() {
  const { isAuthorized, isPinVerified, verifyPin } = useAdminAuth();

  useEffect(() => {
    log('[AdminLayout] enter');
    return () => {
      log('[AdminLayout] exit');
    };
  }, []);

  if (!isAuthorized) {
    return null;
  }

  if (!isPinVerified) {
    return (
      <View className="flex-1 bg-white">
        <PinModal onVerify={verifyPin} />
      </View>
    );
  }

  return <Slot />;
}
