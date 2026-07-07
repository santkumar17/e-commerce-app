import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { api } from '@/src/api';
import { theme } from '@/src/theme';

export default function SellerProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.seller(id!).then(setData).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  if (loading || !data) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color={theme.color.brand} style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  const cardWidth = (width - theme.spacing.xl * 2 - theme.spacing.md) / 2;
  const { seller, products } = data;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable testID="seller-back" onPress={() => router.back()} hitSlop={12}>
          <Feather name="arrow-left" size={22} color={theme.color.onSurface} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ padding: theme.spacing.xl, paddingBottom: theme.spacing.xxxl }}>
        <View style={styles.hero}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(seller.name || '?').charAt(0)}</Text>
          </View>
          <View style={styles.nameRow}>
            <Text style={styles.name} testID="seller-name">{seller.name}</Text>
            {seller.verified && (
              <View style={styles.verifiedBadge} testID="seller-verified-badge">
                <Feather name="check" size={11} color="#fff" />
                <Text style={styles.verifiedText}>VERIFIED</Text>
              </View>
            )}
          </View>
          <Text style={styles.kicker}>Artisan</Text>
          {seller.bio ? <Text style={styles.bio}>{seller.bio}</Text> : null}
          <View style={styles.statRow}>
            <View style={styles.stat}>
              <Text style={styles.statVal} testID="seller-products-count">{data.products_count}</Text>
              <Text style={styles.statLabel}>Live pieces</Text>
            </View>
          </View>
        </View>

        <Text style={styles.section}>All pieces</Text>
        {products.length === 0 ? (
          <Text style={styles.emptyText}>No live listings from this maker yet.</Text>
        ) : (
          <View style={styles.grid}>
            {products.map((p: any) => (
              <Pressable
                key={p.id}
                testID={`seller-product-${p.id}`}
                onPress={() => router.push(`/product/${p.id}`)}
                style={[styles.card, { width: cardWidth }]}
              >
                <Image
                  source={{ uri: p.images?.[0] }}
                  style={[styles.cardImg, { width: cardWidth, height: cardWidth * 1.2 }]}
                  contentFit="cover"
                />
                <Text style={styles.cardTitle} numberOfLines={2}>{p.title}</Text>
                <Text style={styles.cardPrice}>${p.price.toFixed(0)}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.color.surface },
  header: { padding: theme.spacing.xl, paddingBottom: 0 },
  hero: { alignItems: 'center', paddingVertical: theme.spacing.xl },
  avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: theme.color.brandTertiary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: theme.font.heading, fontSize: 36, color: theme.color.brand },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: theme.spacing.md },
  name: { fontFamily: theme.font.heading, fontSize: 26, color: theme.color.onSurface },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: theme.radius.sm, backgroundColor: theme.color.success },
  verifiedText: { color: '#fff', fontSize: 10, letterSpacing: 1 },
  kicker: { fontSize: 11, letterSpacing: 2, color: theme.color.muted, marginTop: 4, textTransform: 'uppercase' },
  bio: { fontSize: 15, color: theme.color.onSurfaceTertiary, textAlign: 'center', paddingHorizontal: theme.spacing.xl, marginTop: theme.spacing.md, lineHeight: 22, fontStyle: 'italic' },
  statRow: { flexDirection: 'row', gap: theme.spacing.xl, marginTop: theme.spacing.lg },
  stat: { alignItems: 'center' },
  statVal: { fontFamily: theme.font.heading, fontSize: 22, color: theme.color.onSurface },
  statLabel: { fontSize: 11, color: theme.color.muted, letterSpacing: 1, marginTop: 2 },
  section: { fontFamily: theme.font.heading, fontSize: 22, color: theme.color.onSurface, marginTop: theme.spacing.xl, marginBottom: theme.spacing.md },
  emptyText: { color: theme.color.muted, textAlign: 'center', paddingVertical: theme.spacing.xl },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md },
  card: { marginBottom: theme.spacing.md },
  cardImg: { borderRadius: theme.radius.sm, backgroundColor: theme.color.surfaceTertiary },
  cardTitle: { marginTop: theme.spacing.sm, fontSize: 14, color: theme.color.onSurface },
  cardPrice: { fontFamily: theme.font.heading, fontSize: 16, color: theme.color.brand, marginTop: 4 },
});
