import { StyleSheet, View } from 'react-native';

import { colors } from '../../constants/theme';

const SYNODIC_MONTH = 29.53;

type Props = {
  /** Day of the Hebrew month (1–30). The molad is near day 1, the full moon near day 15. */
  day: number;
  size?: number;
  lit?: string;
  dark?: string;
};

/**
 * The moon as it looks on this Hebrew date: a small signature for a lunar calendar.
 * Drawn as a lit half plus a center ellipse (lit for gibbous, dark for crescent).
 * `dark` must be opaque, or the lit half shows through the crescent's shadow.
 */
export function MoonPhase({ day, size = 14, lit = colors.accent, dark = colors.accentSoft }: Props) {
  const angle = (2 * Math.PI * (day - 1)) / SYNODIC_MONTH;
  const waxing = angle <= Math.PI;
  const cos = Math.cos(angle);
  const ellipseWidth = Math.max(0.5, Math.abs(cos) * size);
  const gibbous = cos < 0;

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.disk,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: dark },
        // Northern-hemisphere view: waxing is lit on the right. Physical, not RTL-mirrored.
        { transform: [{ scaleX: waxing ? 1 : -1 }] },
      ]}
    >
      <View style={[styles.half, { left: size / 2, width: size / 2, height: size, backgroundColor: lit }]} />
      <View
        style={[
          styles.half,
          {
            left: (size - ellipseWidth) / 2,
            width: ellipseWidth,
            height: size,
            // A true ellipse, not a pill: percentage radii follow width and height separately.
            borderRadius: '50%',
            backgroundColor: gibbous ? lit : dark,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  disk: {
    overflow: 'hidden',
    direction: 'ltr',
  },
  half: {
    position: 'absolute',
    top: 0,
  },
});
