import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useToastStore } from '../../store/toastStore';

export function Toast() {
  const message = useToastStore((state) => state.message);
  const insets = useSafeAreaInsets();

  if (!message) {
    return null;
  }

  return (
    <View
      pointerEvents="none"
      style={[styles.container, { bottom: insets.bottom + 16 }]}
    >
      <View style={styles.bubble}>
        <Text style={styles.text}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    start: 16,
    end: 16,
    alignItems: 'center',
    zIndex: 100,
  },
  bubble: {
    backgroundColor: '#323232',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: 480,
  },
  text: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
