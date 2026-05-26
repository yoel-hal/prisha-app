import { Feather } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

export type IconProps = {
  name: ComponentProps<typeof Feather>['name'];
  size?: number;
  color?: string;
  style?: ComponentProps<typeof Feather>['style'];
};

/** Native: Feather from @expo/vector-icons. Web uses Icon.web.tsx (inline SVG). */
export function Icon({ name, size = 24, color = '#000', style }: IconProps) {
  return <Feather name={name} size={size} color={color} style={style} />;
}
