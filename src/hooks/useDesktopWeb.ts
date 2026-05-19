import { Platform, useWindowDimensions } from 'react-native';

import { DESKTOP_WEB_MIN_WIDTH } from '../constants/layout';

/** True on web when the viewport is wider than the mobile breakpoint. */
export function useDesktopWeb(): boolean {
  const { width } = useWindowDimensions();
  return Platform.OS === 'web' && width > DESKTOP_WEB_MIN_WIDTH;
}
