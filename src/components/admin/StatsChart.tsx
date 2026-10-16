import type { ComponentType } from 'react';
import { useMemo } from 'react';
import { Text, View } from 'react-native';

import { textStartStyle } from '@/utils/rtl';

type StatsChartProps = {
  type: 'pie' | 'bar';
  data: Record<string, number>;
  title: string;
};

const CHART_COLORS = [
  '#2563eb',
  '#16a34a',
  '#d97706',
  '#dc2626',
  '#7c3aed',
  '#0891b2',
  '#ca8a04',
  '#db2777',
  '#4b5563',
  '#0d9488',
];

type ChartKitModule = {
  PieChart: ComponentType<{
    data: {
      name: string;
      population: number;
      color: string;
      legendFontColor: string;
      legendFontSize: number;
    }[];
    width: number;
    height: number;
    chartConfig: { color: (opacity?: number) => string };
    accessor: string;
    backgroundColor: string;
    paddingLeft: string;
    absolute?: boolean;
  }>;
};

let chartKitModule: ChartKitModule | null | undefined;

function getChartKit(): ChartKitModule | null {
  if (chartKitModule !== undefined) {
    return chartKitModule;
  }

  try {
    // Optional dependency — falls back to text list when unavailable.
    chartKitModule = require('react-native-chart-kit') as ChartKitModule;
  } catch {
    chartKitModule = null;
  }

  return chartKitModule;
}

function sortedEntries(data: Record<string, number>, limit?: number) {
  const entries = Object.entries(data)
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a);

  return limit ? entries.slice(0, limit) : entries;
}

function TextFallback({
  entries,
  title,
}: {
  entries: [string, number][];
  title: string;
}) {
  const total = entries.reduce((sum, [, count]) => sum + count, 0);

  return (
    <View className="gap-3">
      <Text className="text-base font-semibold text-neutral-900" style={textStartStyle()}>
        {title}
      </Text>
      {entries.length === 0 ? (
        <Text className="text-sm text-neutral-500" style={textStartStyle()}>
          —
        </Text>
      ) : (
        entries.map(([label, count]) => {
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <View key={label} className="gap-1">
              <View className="flex-row items-center justify-between gap-2">
                <Text className="flex-1 text-sm text-neutral-800" style={textStartStyle()}>
                  {label}
                </Text>
                <Text className="text-sm font-medium text-neutral-600">{count}</Text>
              </View>
              <View className="h-2 overflow-hidden rounded-full bg-neutral-100">
                <View
                  className="h-full rounded-full bg-neutral-800"
                  style={{ width: `${pct}%` }}
                />
              </View>
            </View>
          );
        })
      )}
    </View>
  );
}

function PieChartView({
  entries,
  title,
}: {
  entries: [string, number][];
  title: string;
}) {
  const chartKit = getChartKit();

  const pieData = useMemo(
    () =>
      entries.map(([name, population], index) => ({
        name,
        population,
        color: CHART_COLORS[index % CHART_COLORS.length],
        legendFontColor: '#525252',
        legendFontSize: 12,
      })),
    [entries],
  );

  if (!chartKit || entries.length === 0) {
    return <TextFallback entries={entries} title={title} />;
  }

  const { PieChart } = chartKit;

  return (
    <View className="gap-3">
      <Text className="text-base font-semibold text-neutral-900" style={textStartStyle()}>
        {title}
      </Text>
      <View className="items-center">
        <PieChart
          data={pieData}
          width={280}
          height={200}
          chartConfig={{
            color: (opacity = 1) => `rgba(23, 23, 23, ${opacity})`,
          }}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="0"
          absolute
        />
      </View>
    </View>
  );
}

function BarChartView({
  entries,
  title,
}: {
  entries: [string, number][];
  title: string;
}) {
  const maxValue = entries.reduce((max, [, count]) => Math.max(max, count), 0);

  return (
    <View className="gap-3">
      <Text className="text-base font-semibold text-neutral-900" style={textStartStyle()}>
        {title}
      </Text>
      {entries.length === 0 ? (
        <Text className="text-sm text-neutral-500" style={textStartStyle()}>
          —
        </Text>
      ) : (
        entries.map(([label, count], index) => {
          const widthPct = maxValue > 0 ? (count / maxValue) * 100 : 0;
          return (
            <View key={label} className="gap-1">
              <View className="flex-row items-center justify-between gap-2">
                <Text className="flex-1 text-sm text-neutral-800" style={textStartStyle()}>
                  {label}
                </Text>
                <Text className="text-sm font-medium text-neutral-600">{count}</Text>
              </View>
              <View className="h-3 overflow-hidden rounded-full bg-neutral-100">
                <View
                  className="h-full rounded-full"
                  style={{
                    width: `${widthPct}%`,
                    backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                  }}
                />
              </View>
            </View>
          );
        })
      )}
    </View>
  );
}

export function StatsChart({ type, data, title }: StatsChartProps) {
  const entries = useMemo(
    () => sortedEntries(data, type === 'bar' ? 10 : undefined),
    [data, type],
  );

  if (type === 'pie') {
    return <PieChartView entries={entries} title={title} />;
  }

  return <BarChartView entries={entries} title={title} />;
}
