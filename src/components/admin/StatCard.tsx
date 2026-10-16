import { Text, View } from 'react-native';

import { textStartStyle } from '@/utils/rtl';

type StatCardProps = {
  label: string;
  value: string | number;
  color?: string;
};

export function StatCard({ label, value, color }: StatCardProps) {
  return (
    <View className="min-w-[140px] flex-1 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <Text
        className="text-sm text-neutral-500"
        style={textStartStyle()}
        numberOfLines={2}
      >
        {label}
      </Text>
      <Text
        className="mt-2 text-3xl font-bold text-neutral-900"
        style={[textStartStyle(), color ? { color } : undefined]}
      >
        {value}
      </Text>
    </View>
  );
}
