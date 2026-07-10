import React from 'react';
import { Platform, View, useWindowDimensions } from 'react-native';
import { theme } from '@/src/theme';

/**
 * On web, widens content up to a tablet/desktop max-width instead of letting
 * screens stretch full-bleed edge-to-edge of the browser window. No-op below
 * the tablet breakpoint (today's exact mobile/native behavior, unchanged).
 */
export function ResponsiveFrame({ children }: { children: React.ReactNode }) {
  const { width } = useWindowDimensions();

  if (Platform.OS !== 'web' || width < theme.breakpoints.tablet) {
    return <>{children}</>;
  }

  const maxWidth = width >= theme.breakpoints.desktop
    ? theme.containerMaxWidth.desktop
    : theme.containerMaxWidth.tablet;

  return (
    <View style={{ flex: 1, backgroundColor: theme.color.surfaceTertiary, alignItems: 'center' }}>
      <View style={{ flex: 1, width: '100%', maxWidth, backgroundColor: theme.color.surface }}>
        {children}
      </View>
    </View>
  );
}
