import { Platform, useWindowDimensions } from 'react-native';
import { theme } from '@/src/theme';

/**
 * The actual rendered content width, mirroring ResponsiveFrame's clamp —
 * use this instead of raw useWindowDimensions().width for any grid/card
 * sizing math, since above the tablet breakpoint the frame clamps the
 * rendered width below the raw window width.
 */
export function useContentWidth(): number {
  const { width } = useWindowDimensions();
  if (Platform.OS !== 'web' || width < theme.breakpoints.tablet) return width;
  const maxWidth = width >= theme.breakpoints.desktop
    ? theme.containerMaxWidth.desktop
    : theme.containerMaxWidth.tablet;
  return Math.min(width, maxWidth);
}
