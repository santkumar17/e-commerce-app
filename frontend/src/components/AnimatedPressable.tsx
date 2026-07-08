import React from 'react';
import { PressableProps, StyleProp, ViewStyle, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

interface Props extends PressableProps {
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  children: React.ReactNode;
}

/**
 * Pressable with a subtle scale-down micro-interaction on press.
 * Uses reanimated so gestures stay 60fps.
 */
export function AnimatedPressable({ style, scaleTo = 0.97, onPressIn, onPressOut, children, ...rest }: Props) {
  const scale = useSharedValue(1);
  const a = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={[a]}>
      <Pressable
        onPressIn={(e) => { scale.value = withSpring(scaleTo, { damping: 15, stiffness: 300 }); onPressIn?.(e); }}
        onPressOut={(e) => { scale.value = withSpring(1, { damping: 15, stiffness: 300 }); onPressOut?.(e); }}
        style={style}
        {...rest}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
