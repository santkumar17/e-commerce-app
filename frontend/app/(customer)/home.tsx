import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, FadeInRight } from 'react-native-reanimated';
import { api } from '@/src/api';
import { useAuth } from '@/src/auth';
import { theme } from '@/src/theme';
import { NotifBell } from '@/src/components/NotifBell';
import { ProductCard } from '@/src/components/ProductCard';
import { SkeletonCard } from '@/src/components/Skeleton';

interface Product {
  id: string; title: string; price: number; images: string[]; rating: number; category: string; created_at?: string;
}
interface Category { id: string; name: string; image: string; }

export default function Home() {
  const router = useRouter();
  const { logout } = useAuth();
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
  const railWidth = width * 0.66;

  // sort products by created_at for "new arrivals"
  const newArrivals = [...products]
    .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
    .slice(0, 5);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Slim floating top bar */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.wordmark}>ArtisanMarket</Text>
          <Text style={styles.wordmarkSub}>Handmade, quietly beautiful</Text>
        </View>
        <View style={styles.topActions}>
          <NotifBell color={theme.color.onSurface} onDark={false} testID="home-notif-bell" />
          <Pressable testID="logout-btn" onPress={logout} style={styles.iconBtnLight} hitSlop={8}>
            <Feather name="log-out" size={18} color={theme.color.onSurface} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: theme.spacing.xxxl + 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={theme.color.brand} />}
      >
        {/* Editorial hero */}
        <Animated.View entering={FadeIn.duration(600)} style={styles.heroWrap}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1614244139209-53c071a4737d?w=1200' }}
            style={styles.heroImg}
            contentFit="cover"
            transition={400}
          />
          <LinearGradient
            colors={['transparent', 'rgba(43,41,39,0.35)', 'rgba(43,41,39,0.92)']}
            locations={[0, 0.55, 1]}
            style={styles.heroScrim}
          />
          <View style={styles.heroContent}>
            <View>
              <Text style={styles.heroKicker}>Issue No. 04 · Featured artisan</Text>
              <Animated.Text entering={FadeInDown.delay(200).duration(700)} style={styles.heroTitle}>
                Slow craft,{'\n'}patiently made.
              </Animated.Text>
              <Text style={styles.heroBody}>
                From a small studio in Jaipur — six pieces, six weeks of firing.
              </Text>
            </View>
            <Pressable
              testID="hero-cta"
              onPress={() => router.push('/(customer)/search')}
              style={styles.heroBtn}
              hitSlop={6}
            >
              <Text style={styles.heroBtnText}>Explore the collection</Text>
              <Feather name="arrow-right" size={16} color="#fff" />
            </Pressable>
          </View>
        </Animated.View>

        {/* Category chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: theme.spacing.xl, gap: theme.spacing.sm }}
          style={styles.chipRow}
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

        {/* New arrivals rail */}
        {!loading && newArrivals.length > 0 && (
          <>
            <View style={styles.sectionHead}>
              <View>
                <Text style={styles.sectionKicker}>Just in</Text>
                <Text style={styles.sectionTitle}>New arrivals</Text>
              </View>
              <Pressable onPress={() => router.push('/(customer)/search')} hitSlop={8}>
                <Text style={styles.linkText}>See all →</Text>
              </Pressable>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: theme.spacing.xl, gap: theme.spacing.md }}
            >
              {newArrivals.map((p, i) => (
                <Animated.View key={p.id} entering={FadeInRight.delay(i * 80).duration(500)}>
                  <Pressable
                    testID={`new-arrival-${p.id}`}
                    onPress={() => router.push(`/product/${p.id}`)}
                    style={[styles.railCard, { width: railWidth }]}
                  >
                    <Image
                      source={{ uri: p.images?.[0] }}
                      style={[styles.railImg, { width: railWidth, height: railWidth * 0.75 }]}
                      contentFit="cover"
                      transition={300}
                    />
                    <LinearGradient
                      colors={['transparent', 'rgba(43,41,39,0.85)']}
                      style={styles.railScrim}
                    />
                    <View style={styles.railContent}>
                      <Text style={styles.railKicker}>{p.category?.toUpperCase()}</Text>
                      <Text style={styles.railTitle} numberOfLines={2}>{p.title}</Text>
                      <View style={styles.railBottom}>
                        <Text style={styles.railPrice}>${p.price.toFixed(0)}</Text>
                        <View style={styles.railPill}>
                          <Text style={styles.railPillText}>View</Text>
                          <Feather name="arrow-right" size={11} color="#fff" />
                        </View>
                      </View>
                    </View>
                  </Pressable>
                </Animated.View>
              ))}
            </ScrollView>
          </>
        )}

        {/* Grid */}
        <View style={styles.sectionHead}>
          <View>
            <Text style={styles.sectionKicker}>The edit</Text>
            <Text style={styles.sectionTitle}>{activeCat ? cats.find((c) => c.id === activeCat)?.name : 'Trending now'}</Text>
          </View>
          <Text style={styles.countPill}>{products.length}</Text>
        </View>

        {loading ? (
          <View style={styles.grid}>
            {[0, 1, 2, 3].map((i) => (
              <SkeletonCard key={i} width={cardWidth} imgHeight={cardWidth * 1.25} />
            ))}
          </View>
        ) : products.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="package" size={30} color={theme.color.muted} />
            <Text style={styles.emptyText}>No pieces in this category yet.</Text>
            <Pressable testID="empty-see-all" onPress={() => setActiveCat(null)} style={styles.emptyBtn}>
              <Text style={styles.emptyBtnText}>See all pieces</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.grid}>
            {products.map((p, i) => (
              <ProductCard key={p.id} product={p} width={cardWidth} index={i} />
            ))}
          </View>
        )}

        {/* Sign-off strip */}
        {!loading && products.length > 0 && (
          <Animated.View entering={FadeIn.duration(700)} style={styles.signOff}>
            <View style={styles.signOffLine} />
            <Text style={styles.signOffText}>Every piece · shipped from the maker&apos;s hands to yours</Text>
            <View style={styles.signOffLine} />
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.color.surface },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: theme.spacing.xl, paddingBottom: theme.spacing.md },
  wordmark: { fontFamily: theme.font.heading, fontSize: 20, color: theme.color.onSurface, letterSpacing: 0.3 },
  wordmarkSub: { fontSize: 10, color: theme.color.muted, marginTop: 2, letterSpacing: 1.5, textTransform: 'uppercase' },
  topActions: { flexDirection: 'row', gap: 10 },
  iconBtnLight: { padding: 8, borderRadius: theme.radius.pill, backgroundColor: theme.color.surfaceTertiary },

  heroWrap: { marginHorizontal: theme.spacing.xl, marginTop: theme.spacing.sm, borderRadius: theme.radius.lg, overflow: 'hidden', height: 380, ...theme.elevation.subtle },
  heroImg: { position: 'absolute', width: '100%', height: '100%' },
  heroScrim: { position: 'absolute', width: '100%', height: '100%' },
  heroContent: { flex: 1, padding: theme.spacing.xl, justifyContent: 'flex-end', gap: theme.spacing.lg },
  heroKicker: { color: '#fff', fontSize: 10, letterSpacing: 2.5, textTransform: 'uppercase', opacity: 0.85, marginBottom: theme.spacing.sm },
  heroTitle: { color: '#fff', fontFamily: theme.font.heading, fontSize: 40, lineHeight: 44, letterSpacing: -0.5 },
  heroBody: { color: '#fff', opacity: 0.85, fontSize: 13, lineHeight: 20, marginTop: theme.spacing.sm },
  heroBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 10, borderRadius: theme.radius.pill, backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  heroBtnText: { color: '#fff', fontSize: 13, letterSpacing: 0.5 },

  chipRow: { height: 56, marginTop: theme.spacing.lg },
  catChip: { paddingHorizontal: 16, height: 36, borderRadius: theme.radius.pill, borderWidth: 1, borderColor: theme.color.border, backgroundColor: theme.color.surfaceSecondary, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  catChipActive: { backgroundColor: theme.color.surfaceInverse, borderColor: theme.color.surfaceInverse },
  catChipText: { fontSize: 13, color: theme.color.onSurface, letterSpacing: 0.2 },
  catChipTextActive: { color: '#fff' },

  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: theme.spacing.xl, marginTop: theme.spacing.xxl, marginBottom: theme.spacing.md },
  sectionKicker: { fontSize: 10, letterSpacing: 2.5, textTransform: 'uppercase', color: theme.color.muted },
  sectionTitle: { fontFamily: theme.font.heading, fontSize: 26, color: theme.color.onSurface, marginTop: 2, letterSpacing: -0.3 },
  linkText: { color: theme.color.brand, fontSize: 13, letterSpacing: 0.2 },
  countPill: { fontSize: 12, color: theme.color.muted, backgroundColor: theme.color.surfaceTertiary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: theme.radius.pill, overflow: 'hidden' },

  railCard: { borderRadius: theme.radius.md, overflow: 'hidden', backgroundColor: theme.color.surfaceTertiary, ...theme.elevation.subtle },
  railImg: {},
  railScrim: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '70%' },
  railContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: theme.spacing.lg, gap: 4 },
  railKicker: { color: '#fff', opacity: 0.8, fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 },
  railTitle: { color: '#fff', fontFamily: theme.font.heading, fontSize: 22, lineHeight: 26, letterSpacing: -0.2 },
  railBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: theme.spacing.sm },
  railPrice: { color: '#fff', fontFamily: theme.font.heading, fontSize: 20 },
  railPill: { flexDirection: 'row', gap: 4, alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: theme.radius.pill, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  railPillText: { color: '#fff', fontSize: 11, letterSpacing: 0.5 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md, paddingHorizontal: theme.spacing.xl },

  empty: { alignItems: 'center', paddingHorizontal: theme.spacing.xxxl, paddingVertical: theme.spacing.xxxl, gap: theme.spacing.md },
  emptyText: { color: theme.color.muted, fontSize: 14, textAlign: 'center' },
  emptyBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: theme.radius.sm, backgroundColor: theme.color.brand, marginTop: theme.spacing.sm },
  emptyBtnText: { color: '#fff', fontSize: 13 },

  signOff: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, marginTop: theme.spacing.xxxl, paddingHorizontal: theme.spacing.xl },
  signOffLine: { flex: 1, height: 1, backgroundColor: theme.color.border },
  signOffText: { fontSize: 10, color: theme.color.muted, letterSpacing: 1.5, textTransform: 'uppercase' },
});
