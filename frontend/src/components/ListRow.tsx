import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { AnimatedPressable } from '@/src/components/AnimatedPressable';
import { theme } from '@/src/theme';

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1449247709967-d4461a6a6103?w=200';

interface Props {
  imageUri?: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  trailing?: React.ReactNode;
  index?: number;
  testID?: string;
}

/** Shared image + title + subtitle row, used by Search/Cart/Wishlist so thumbnail size and spacing never drift between them. */
export function ListRow({ imageUri, title, subtitle, onPress, trailing, index = 0, testID }: Props) {
  const content = (
    <>
      <Image source={{ uri: imageUri || FALLBACK_IMG }} style={styles.img} contentFit="cover" />
      <View style={{ flex: 1 }}>
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {trailing}
    </>
  );

  return (
    <Animated.View entering={FadeInUp.delay(Math.min(index, 8) * 40).duration(350)}>
      {onPress ? (
        <AnimatedPressable testID={testID} onPress={onPress} style={styles.row}>
          {content}
        </AnimatedPressable>
      ) : (
        <View testID={testID} style={styles.row}>
          {content}
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: theme.spacing.md, alignItems: 'center', paddingVertical: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.color.divider },
  img: { width: 76, height: 76, borderRadius: theme.radius.sm, backgroundColor: theme.color.surfaceTertiary },
  title: { fontSize: 15, color: theme.color.onSurface },
  subtitle: { fontFamily: theme.font.heading, fontSize: 16, color: theme.color.brand, marginTop: 4 },
});
