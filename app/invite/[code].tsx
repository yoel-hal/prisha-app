import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';

import { savePendingCoupleInviteCode } from '../../src/utils/pendingCoupleInvite';

/**
 * Universal-link entry for https://prishatracker.app/invite/:code
 * Tries the native scheme, then routes to couple settings (web fallback).
 */
export default function InviteLinkScreen() {
  const router = useRouter();
  const { code } = useLocalSearchParams<{ code: string | string[] }>();
  const inviteCode = (Array.isArray(code) ? code[0] : code)?.trim().toUpperCase() ?? '';

  useEffect(() => {
    if (!inviteCode) {
      router.replace('/');
      return;
    }

    void (async () => {
      await savePendingCoupleInviteCode(inviteCode);

      if (Platform.OS !== 'web') {
        try {
          await Linking.openURL(`prisha://invite/${inviteCode}`);
        } catch {
          // Fall through to in-app settings route.
        }
      }

      router.replace({
        pathname: '/(app)/settings/couple',
        params: { inviteCode },
      });
    })();
  }, [inviteCode, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
});
