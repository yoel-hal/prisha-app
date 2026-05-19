import { Platform, type ViewStyle } from 'react-native';

/** Extra styles so ScrollView-based screens fill and scroll on web. */
export function webScreenScrollStyles(): {
  safe: ViewStyle | undefined;
  scroll: ViewStyle | undefined;
} {
  if (Platform.OS !== 'web') {
    return { safe: undefined, scroll: undefined };
  }

  return {
    safe: { flex: 1 },
    scroll: { flex: 1 },
  };
}
