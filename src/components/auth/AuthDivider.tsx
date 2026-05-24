import { StyleSheet, Text, View } from 'react-native';

type AuthDividerProps = {
  label: string;
};

export function AuthDivider({ label }: AuthDividerProps) {
  return (
    <View style={styles.row}>
      <View style={styles.line} />
      <Text style={styles.label}>{label}</Text>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 4,
  },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#ddd',
  },
  label: {
    fontSize: 14,
    color: '#888',
  },
});
