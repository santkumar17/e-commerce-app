import React from 'react';
import { Platform, PressableProps, StyleProp, ViewStyle, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

interface Props extends PressableProps {
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  /** Subtle lift-on-hover for web/desktop pointer input. Set false to opt out (e.g. full-bleed rows). */
  hoverEffect?: boolean;
  children: React.ReactNode;
}

const isWeb = Platform.OS === 'web';

/**
 * Pressable with a subtle scale-down micro-interaction on press, plus a
 * subtle scale-up on web hover (mouse/trackpad — ignored on touch).
 * Uses reanimated so gestures stay 60fps.
 */
export function AnimatedPressable({ style, scaleTo = 0.97, hoverEffect = true, onPressIn, onPressOut, children, ...rest }: Props) {
  const scale = useSharedValue(1);
  const a = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const hoverProps = isWeb && hoverEffect ? {
    onHoverIn: () => { scale.value = withSpring(1.02, { damping: 15, stiffness: 300 }); },
    onHoverOut: () => { scale.value = withSpring(1, { damping: 15, stiffness: 300 }); },
  } : {};
  return (
    <Animated.View style={[a]}>
      <Pressable
        onPressIn={(e) => { scale.value = withSpring(scaleTo, { damping: 15, stiffness: 300 }); onPressIn?.(e); }}
        onPressOut={(e) => { scale.value = withSpring(1, { damping: 15, stiffness: 300 }); onPressOut?.(e); }}
        style={style}
        {...hoverProps}
        {...rest}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
