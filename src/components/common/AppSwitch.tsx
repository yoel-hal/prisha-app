import { Platform, Switch, type SwitchProps } from 'react-native';

const TRACK_OFF = '#d4d4d4';
const TRACK_ON = '#1a1a1a';

// React Native Web colours the "on" thumb with its own prop, which the native types don't declare.
const webOnlyProps = (Platform.OS === 'web' ? { activeThumbColor: '#fff' } : {}) as object;

/** Switch in the app's colours, so toggles look the same on every screen and platform. */
export function AppSwitch(props: SwitchProps) {
  return (
    <Switch
      trackColor={{ false: TRACK_OFF, true: TRACK_ON }}
      thumbColor="#fff"
      ios_backgroundColor={TRACK_OFF}
      {...webOnlyProps}
      {...props}
    />
  );
}
