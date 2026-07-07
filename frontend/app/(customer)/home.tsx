import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl, ActivityIndicator, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '@/src/api';
import { useAuth } from '@/src/auth';
import { theme } from '@/src/theme';
import { NotifBell } from '@/src/components/NotifBell';

interface Product {
  id: string; title: string; price: number; images: string[]; rating: number; category: string;
}
interface Category { id: string; name: string; image: string; }

export default function Home() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { width } = useWindowDimensions();
  const [cats, setCats] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCat, setActiveCat] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [c, p] = await Promise.all([api.categories(), api.products(activeCat ? { category: activeCat } : {})]);
      setCats(c);
      setProducts(p);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeCat]);

  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const cardWidth = (width - theme.spacing.xl * 2 - theme.spacing.md) / 2;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: theme.spacing.xxxl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={theme.color.brand} />}
      >
        {/* Hero */}
        <View style={styles.heroWrap}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1614244139209-53c071a4737d?w=1200' }}
            style={styles.heroImg}
            contentFit="cover"
          />
          <LinearGradient colors={['transparent', 'rgba(43,41,39,0.85)']} style={styles.heroScrim} />
          <View style={styles.heroContent}>
            <View style={styles.heroTop}>
              <Text style={styles.hello}>Hello{user ? `, ${user.name.split(' ')[0]}` : ''}</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <NotifBell testID="home-notif-bell" />
                <Pressable testID="logout-btn" onPress={logout} style={styles.iconBtn}>
                  <Feather name="log-out" size={18} color="#fff" />
                </Pressable>
              </View>
            </View>
            <Text style={styles.heroKicker}>Featured artisan</Text>
            <Text style={styles.heroTitle}>Slow craft,{'\n'}patiently made.</Text>
          </View>
        </View>

        {/* Categories */}
        <Text style={styles.sectionTitle}>Browse by craft</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: theme.spacing.xl, gap: theme.spacing.sm }}
          style={{ height: 56 }}
        >
          <Pressable testID="cat-all" onPress={() => setActiveCat(null)} style={[styles.catChip, !activeCat && styles.catChipActive]}>
            <Text style={[styles.catChipText, !activeCat && styles.catChipTextActive]}>All</Text>
          </Pressable>
          {cats.map((c) => (
            <Pressable
              key={c.id}
              testID={`cat-${c.id}`}
              onPress={() => setActiveCat(c.id)}
              style={[styles.catChip, activeCat === c.id && styles.catChipActive]}
            >
              <Text style={[styles.catChipText, activeCat === c.id && styles.catChipTextActive]}>{c.name}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Grid */}
        <Text style={styles.sectionTitle}>Trending now</Text>
        {loading ? (
          <ActivityIndicator color={theme.color.brand} style={{ marginTop: theme.spacing.xxl }} />
        ) : products.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="package" size={32} color={theme.color.muted} />
            <Text style={styles.emptyText}>No products in this category yet.</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {products.map((p) => (
              <Pressable
                key={p.id}
                testID={`product-card-${p.id}`}
                onPress={() => router.push(`/product/${p.id}`)}
                style={[styles.card, { width: cardWidth }]}
              >
                <Image
                  source={{ uri: p.images?.[0] || 'https://images.unsplash.com/photo-1449247709967-d4461a6a6103?w=400' }}
                  style={[styles.cardImg, { width: cardWidth, height: cardWidth * 1.2 }]}
                  contentFit="cover"
                />
                <Text style={styles.cardTitle} numberOfLines={2}>{p.title}</Text>
                <View style={styles.cardMeta}>
                  <Text style={styles.cardPrice}>${p.price.toFixed(0)}</Text>
                  <View style={styles.rating}>
                    <Feather name="star" size={11} color={theme.color.warning} />
                    <Text style={styles.ratingText}>{(p.rating || 0).toFixed(1)}</Text>
                  </View>
                </View>
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
  heroWrap: { height: 320, marginHorizontal: theme.spacing.xl, marginTop: theme.spacing.sm, borderRadius: theme.radius.md, overflow: 'hidden' },
  heroImg: { position: 'absolute', width: '100%', height: '100%' },
  heroScrim: { position: 'absolute', width: '100%', height: '100%' },
  heroContent: { flex: 1, padding: theme.spacing.xl, justifyContent: 'space-between' },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hello: { color: '#fff', fontFamily: theme.font.body, fontSize: 14, opacity: 0.9 },
  iconBtn: { padding: 8, borderRadius: theme.radius.pill, backgroundColor: 'rgba(255,255,255,0.15)' },
  heroKicker: { color: '#fff', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', opacity: 0.85, marginBottom: 8 },
  heroTitle: { color: '#fff', fontFamily: theme.font.heading, fontSize: 36, lineHeight: 40 },
  sectionTitle: { fontFamily: theme.font.heading, fontSize: 22, color: theme.color.onSurface, paddingHorizontal: theme.spacing.xl, marginTop: theme.spacing.xxl, marginBottom: theme.spacing.md },
  catChip: { paddingHorizontal: 16, height: 36, borderRadius: theme.radius.pill, borderWidth: 1, borderColor: theme.color.border, backgroundColor: theme.color.surfaceSecondary, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  catChipActive: { backgroundColor: theme.color.brand, borderColor: theme.color.brand },
  catChipText: { fontSize: 13, color: theme.color.onSurface },
  catChipTextActive: { color: '#fff' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md, paddingHorizontal: theme.spacing.xl },
  card: { marginBottom: theme.spacing.md },
  cardImg: { borderRadius: theme.radius.sm, backgroundColor: theme.color.surfaceTertiary },
  cardTitle: { marginTop: theme.spacing.sm, fontSize: 14, color: theme.color.onSurface, fontFamily: theme.font.body },
  cardMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  cardPrice: { fontFamily: theme.font.heading, fontSize: 16, color: theme.color.brand },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 12, color: theme.color.muted },
  empty: { alignItems: 'center', padding: theme.spacing.xxl, gap: theme.spacing.md },
  emptyText: { color: theme.color.muted, fontSize: 14 },
});
