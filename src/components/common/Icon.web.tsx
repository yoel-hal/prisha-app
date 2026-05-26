import type { CSSProperties } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { WEB_ICONS } from './iconPaths';

export type IconProps = {
  name: string;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
};

function toSvgPaths(pathData: string): string[] {
  const segments = pathData.split(/(?= M)/);
  return segments.map((segment, index) => {
    const trimmed = segment.trim();
    if (index === 0) {
      return trimmed;
    }
    return trimmed.startsWith('M') ? trimmed : `M${trimmed}`;
  });
}

export function Icon({ name, size = 24, color = '#000', style }: IconProps) {
  const pathData = WEB_ICONS[name as keyof typeof WEB_ICONS];

  if (!pathData) {
    console.warn(`[Icon] No web SVG for icon: "${name}"`);
    return null;
  }

  const flatStyle = StyleSheet.flatten(style) as ViewStyle | undefined;
  const svgStyle: CSSProperties = {
    width: size,
    height: size,
    ...(flatStyle as CSSProperties),
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={svgStyle}
      aria-hidden
    >
      {toSvgPaths(pathData).map((d, index) => (
        <path key={`${name}-${index}`} d={d} />
      ))}
    </svg>
  );
}
