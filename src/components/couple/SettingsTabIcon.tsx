import { Feather } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { useAuthStore } from '../../store/authStore';

export function SettingsTabIcon({
  color,
  size,
}: {
  color: string;
  size: number;
}) {
  const pendingInvite = useAuthStore((state) => state.pendingInvite);

  return (
    <View style={styles.wrap}>
      <Feather name="settings" size={size} color={color} />
      {pendingInvite ? <View style={styles.badge} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 0,
    end: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E53935',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
});
