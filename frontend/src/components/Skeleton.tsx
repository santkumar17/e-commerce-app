import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { useEffect } from 'react';
import { theme } from '@/src/theme';

interface Props {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 16, radius = theme.radius.sm, style }: Props) {
  const opacity = useSharedValue(0.5);
  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [opacity]);
  const a = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={[styles.base, { width: width as any, height, borderRadius: radius }, a, style]} />
  );
}

const styles = StyleSheet.create({
  base: { backgroundColor: theme.color.surfaceTertiary },
});

// Convenience: skeleton product card grid item
export function SkeletonCard({ width, imgHeight }: { width: number; imgHeight: number }) {
  return (
    <View style={{ width, marginBottom: theme.spacing.md }}>
      <Skeleton width={width} height={imgHeight} radius={theme.radius.sm} />
      <View style={{ marginTop: theme.spacing.sm }}>
        <Skeleton width={'85%'} height={12} />
        <View style={{ height: 6 }} />
        <Skeleton width={'55%'} height={12} />
      </View>
    </View>
  );
}
