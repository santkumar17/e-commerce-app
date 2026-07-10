import { Platform, useWindowDimensions } from 'react-native';
import { theme } from '@/src/theme';

/** Web-only breakpoints — native always reports isMobile (today's unchanged behavior). */
export function useBreakpoint() {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isDesktop = isWeb && width >= theme.breakpoints.desktop;
  const isTablet = isWeb && !isDesktop && width >= theme.breakpoints.tablet;
  const isMobile = !isDesktop && !isTablet;
  return { isMobile, isTablet, isDesktop, width };
}
