import { Icon } from '@/components/common/Icon';
import { Linking, Pressable, StyleSheet, Text } from 'react-native';

const BUY_ME_COFFEE_URL = process.env.EXPO_PUBLIC_BUYMEACOFFEE_URL;

export function BuyMeCoffeeButton() {
  if (!BUY_ME_COFFEE_URL) {
    return null;
  }

  return (
    <Pressable
      style={styles.button}
      onPress={() => void Linking.openURL(BUY_ME_COFFEE_URL)}
    >
      <Icon name="coffee" size={18} color="#1a1a1a" />
      <Text style={styles.label}>Buy Me a Coffee</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e5e5',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#fafafa',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
});
