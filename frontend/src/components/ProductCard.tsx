import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { AnimatedPressable } from './AnimatedPressable';
import { theme } from '@/src/theme';

interface Props {
  product: {
    id: string;
    title: string;
    price: number;
    images?: string[];
    rating?: number;
    category?: string;
  };
  width: number;
  index?: number;
}

export function ProductCard({ product, width, index = 0 }: Props) {
  const router = useRouter();
  const imgHeight = width * 1.25;

  return (
    <Animated.View entering={FadeInUp.delay(Math.min(index, 8) * 60).duration(400).springify().damping(16)}>
      <AnimatedPressable
        testID={`product-card-${product.id}`}
        onPress={() => router.push(`/product/${product.id}`)}
        style={{ width, marginBottom: theme.spacing.lg }}
      >
        <View style={[styles.imgWrap, { width, height: imgHeight }]}>
          <Image
            source={{ uri: product.images?.[0] || 'https://images.unsplash.com/photo-1449247709967-d4461a6a6103?w=600' }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            transition={300}
          />
          {product.category ? (
            <View style={styles.catTag}>
              <Text style={styles.catTagText}>{product.category.toUpperCase()}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.title} numberOfLines={2}>{product.title}</Text>
        <View style={styles.meta}>
          <Text style={styles.price}>${product.price.toFixed(0)}</Text>
          {product.rating ? (
            <View style={styles.rating}>
              <Feather name="star" size={11} color={theme.color.warning} />
              <Text style={styles.ratingText}>{product.rating.toFixed(1)}</Text>
            </View>
          ) : null}
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  imgWrap: { borderRadius: theme.radius.md, overflow: 'hidden', backgroundColor: theme.color.surfaceTertiary, position: 'relative' },
  catTag: { position: 'absolute', top: 10, left: 10, paddingHorizontal: 8, paddingVertical: 4, borderRadius: theme.radius.sm, backgroundColor: 'rgba(250,249,246,0.9)' },
  catTagText: { fontSize: 9, letterSpacing: 1.2, color: theme.color.onSurfaceTertiary },
  title: { marginTop: theme.spacing.sm + 2, fontSize: 14, lineHeight: 18, color: theme.color.onSurface, fontFamily: theme.font.body, letterSpacing: 0.1 },
  meta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  price: { fontFamily: theme.font.heading, fontSize: 17, color: theme.color.brand, letterSpacing: 0.2 },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 12, color: theme.color.muted },
});
