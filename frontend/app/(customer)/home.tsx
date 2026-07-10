import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, FadeInRight } from 'react-native-reanimated';
import { api } from '@/src/api';
import { useAuth } from '@/src/auth';
import { theme } from '@/src/theme';
import { NotifBell } from '@/src/components/NotifBell';
import { ProductCard } from '@/src/components/ProductCard';
import { SkeletonCard } from '@/src/components/Skeleton';
import { Footer } from '@/src/components/Footer';
import { useBreakpoint } from '@/src/hooks/use-breakpoint';
import { useContentWidth } from '@/src/hooks/use-content-width';
import { useGridColumns } from '@/src/hooks/use-grid-columns';

interface Product {
  id: string; title: string; price: number; images: string[]; rating: number; review_count?: number; category: string; created_at?: string;
}
interface Category { id: string; name: string; image: string; }

export default function Home() {
  const router = useRouter();
  const { logout } = useAuth();
  const { category: categoryParam } = useLocalSearchParams<{ category?: string }>();
  const { isMobile, isTablet, isDesktop } = useBreakpoint();
  const contentWidth = useContentWidth();
  const { cardWidth, columns } = useGridColumns();
  const [cats, setCats] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCat, setActiveCat] = useState<string | null>(null);

  useEffect(() => { if (categoryParam) setActiveCat(categoryParam); }, [categoryParam]);

  const load = useCallback(async () => {
    try {
      const [c, p, f] = await Promise.all([
        api.categories(),
        api.products(activeCat ? { category: activeCat } : {}),
        api.featured().catch(() => []),
      ]);
      setCats(c);
      setProducts(p);
      setFeatured(f);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeCat]);

  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const railWidth = isDesktop ? 320 : isTablet ? 280 : contentWidth * 0.66;
  const catCardWidth = isDesktop ? 160 : isTablet ? 140 : 104;

  const newArrivals = [...products]
    .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
    .slice(0, 5);
  const bestSellers = [...products]
    .filter((p) => (p.rating || 0) > 0)
    .sort((a, b) => (b.rating || 0) - (a.rating || 0) || (b.review_count || 0) - (a.review_count || 0))
    .slice(0, 8);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {!isDesktop && (
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
      )}

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: theme.spacing.xxxl + 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={theme.color.brand} />}
      >
        {/* Editorial hero */}
        <Animated.View entering={FadeIn.duration(600)} style={[styles.heroWrap, { height: isDesktop ? 480 : isTablet ? 420 : 380 }]}>
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
          <View style={[styles.heroContent, isDesktop && { maxWidth: 560 }]}>
            <View>
              <Text style={styles.heroKicker}>Issue No. 04 · Featured artisan</Text>
              <Animated.Text entering={FadeInDown.delay(200).duration(700)} style={[styles.heroTitle, isDesktop && { fontSize: 52, lineHeight: 56 }]}>
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
              <Feather name="arrow-right" size={16} color={theme.color.onSurfaceInverse} />
            </Pressable>
          </View>
        </Animated.View>

        {/* Categories */}
        {isMobile ? (
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
        ) : (
          <>
            <View style={styles.sectionHead}>
              <View>
                <Text style={styles.sectionKicker}>Explore</Text>
                <Text style={styles.sectionTitle}>Shop by category</Text>
              </View>
            </View>
            <View style={styles.catGrid}>
              <Pressable testID="cat-all" onPress={() => setActiveCat(null)} style={[styles.catCard, { width: catCardWidth }, !activeCat && styles.catCardActive]}>
                <View style={[styles.catCardImgWrap, { width: catCardWidth, height: catCardWidth }]}>
                  <Feather name="grid" size={22} color={!activeCat ? theme.color.onBrandPrimary : theme.color.brand} />
                </View>
                <Text style={[styles.catCardText, !activeCat && styles.catCardTextActive]}>All</Text>
              </Pressable>
              {cats.map((c) => (
                <Pressable key={c.id} testID={`cat-${c.id}`} onPress={() => setActiveCat(c.id)} style={[styles.catCard, { width: catCardWidth }, activeCat === c.id && styles.catCardActive]}>
                  <Image source={{ uri: c.image }} style={[styles.catCardImgWrap, { width: catCardWidth, height: catCardWidth }]} contentFit="cover" />
                  <Text style={[styles.catCardText, activeCat === c.id && styles.catCardTextActive]}>{c.name}</Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        {/* New arrivals rail */}
        {!loading && newArrivals.length > 0 && (
          <ProductRail
            kicker="Just in"
            title="New arrivals"
            products={newArrivals}
            railWidth={railWidth}
            onSeeAll={() => router.push('/(customer)/search')}
            onPressItem={(id) => router.push(`/product/${id}`)}
            testIdPrefix="new-arrival"
          />
        )}

        {/* Featured rail — GET /products/featured */}
        {!loading && featured.length > 0 && (
          <ProductRail
            kicker="Curated"
            title="Featured products"
            products={featured}
            railWidth={railWidth}
            onPressItem={(id) => router.push(`/product/${id}`)}
            testIdPrefix="featured"
          />
        )}

        {/* Best sellers rail — client-derived from rating/review_count, same pattern as New Arrivals */}
        {!loading && bestSellers.length > 0 && (
          <ProductRail
            kicker="Loved by customers"
            title="Best sellers"
            products={bestSellers}
            railWidth={railWidth}
            onPressItem={(id) => router.push(`/product/${id}`)}
            testIdPrefix="bestseller"
          />
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
            {Array.from({ length: columns * 2 }).map((_, i) => (
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

        {!isMobile && <Footer />}
      </ScrollView>
    </SafeAreaView>
  );
}

function ProductRail({ kicker, title, products, railWidth, onSeeAll, onPressItem, testIdPrefix }: {
  kicker: string; title: string; products: Product[]; railWidth: number;
  onSeeAll?: () => void; onPressItem: (id: string) => void; testIdPrefix: string;
}) {
  return (
    <>
      <View style={styles.sectionHead}>
        <View>
          <Text style={styles.sectionKicker}>{kicker}</Text>
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        {onSeeAll && (
          <Pressable onPress={onSeeAll} hitSlop={8}>
            <Text style={styles.linkText}>See all →</Text>
          </Pressable>
        )}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: theme.spacing.xl, gap: theme.spacing.md }}
      >
        {products.map((p, i) => (
          <Animated.View key={p.id} entering={FadeInRight.delay(i * 80).duration(500)}>
            <Pressable
              testID={`${testIdPrefix}-${p.id}`}
              onPress={() => onPressItem(p.id)}
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
                    <Feather name="arrow-right" size={11} color={theme.color.onSurfaceInverse} />
                  </View>
                </View>
              </View>
            </Pressable>
          </Animated.View>
        ))}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.color.surface },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: theme.spacing.xl, paddingBottom: theme.spacing.md },
  wordmark: { fontFamily: theme.font.heading, fontSize: 20, color: theme.color.onSurface, letterSpacing: 0.3 },
  wordmarkSub: { fontSize: 10, color: theme.color.muted, marginTop: 2, letterSpacing: 1.5, textTransform: 'uppercase' },
  topActions: { flexDirection: 'row', gap: 10 },
  iconBtnLight: { padding: 8, borderRadius: theme.radius.pill, backgroundColor: theme.color.surfaceTertiary },

  heroWrap: { marginHorizontal: theme.spacing.xl, marginTop: theme.spacing.sm, borderRadius: theme.radius.lg, overflow: 'hidden', ...theme.elevation.subtle },
  heroImg: { position: 'absolute', width: '100%', height: '100%' },
  heroScrim: { position: 'absolute', width: '100%', height: '100%' },
  heroContent: { flex: 1, padding: theme.spacing.xl, justifyContent: 'flex-end', gap: theme.spacing.lg },
  heroKicker: { color: theme.color.onSurfaceInverse, fontSize: 10, letterSpacing: 2.5, textTransform: 'uppercase', opacity: 0.85, marginBottom: theme.spacing.sm },
  heroTitle: { color: theme.color.onSurfaceInverse, fontFamily: theme.font.heading, fontSize: 40, lineHeight: 44, letterSpacing: -0.5 },
  heroBody: { color: theme.color.onSurfaceInverse, opacity: 0.85, fontSize: 13, lineHeight: 20, marginTop: theme.spacing.sm },
  heroBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 10, borderRadius: theme.radius.pill, backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  heroBtnText: { color: theme.color.onSurfaceInverse, fontSize: 13, letterSpacing: 0.5 },

  chipRow: { height: 56, marginTop: theme.spacing.lg },
  catChip: { paddingHorizontal: 16, height: 36, borderRadius: theme.radius.pill, borderWidth: 1, borderColor: theme.color.border, backgroundColor: theme.color.surfaceSecondary, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  catChipActive: { backgroundColor: theme.color.surfaceInverse, borderColor: theme.color.surfaceInverse },
  catChipText: { fontSize: 13, color: theme.color.onSurface, letterSpacing: 0.2 },
  catChipTextActive: { color: theme.color.onSurfaceInverse },

  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.lg, paddingHorizontal: theme.spacing.xl },
  catCard: { alignItems: 'center', gap: theme.spacing.sm },
  catCardActive: {},
  catCardImgWrap: { borderRadius: theme.radius.lg, backgroundColor: theme.color.brand, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  catCardText: { fontSize: 13, color: theme.color.onSurface },
  catCardTextActive: { color: theme.color.brand, fontFamily: theme.font.bodyMedium },

  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: theme.spacing.xl, marginTop: theme.spacing.xxl, marginBottom: theme.spacing.md },
  sectionKicker: { fontSize: 10, letterSpacing: 2.5, textTransform: 'uppercase', color: theme.color.muted },
  sectionTitle: { fontFamily: theme.font.heading, fontSize: 26, color: theme.color.onSurface, marginTop: 2, letterSpacing: -0.3 },
  linkText: { color: theme.color.brand, fontSize: 13, letterSpacing: 0.2 },
  countPill: { fontSize: 12, color: theme.color.muted, backgroundColor: theme.color.surfaceTertiary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: theme.radius.pill, overflow: 'hidden' },

  railCard: { borderRadius: theme.radius.md, overflow: 'hidden', backgroundColor: theme.color.surfaceTertiary, ...theme.elevation.subtle },
  railImg: {},
  railScrim: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '70%' },
  railContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: theme.spacing.lg, gap: 4 },
  railKicker: { color: theme.color.onSurfaceInverse, opacity: 0.8, fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 },
  railTitle: { color: theme.color.onSurfaceInverse, fontFamily: theme.font.heading, fontSize: 22, lineHeight: 26, letterSpacing: -0.2 },
  railBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: theme.spacing.sm },
  railPrice: { color: theme.color.onSurfaceInverse, fontFamily: theme.font.heading, fontSize: 20 },
  railPill: { flexDirection: 'row', gap: 4, alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: theme.radius.pill, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  railPillText: { color: theme.color.onSurfaceInverse, fontSize: 11, letterSpacing: 0.5 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md, paddingHorizontal: theme.spacing.xl },

  empty: { alignItems: 'center', paddingHorizontal: theme.spacing.xxxl, paddingVertical: theme.spacing.xxxl, gap: theme.spacing.md },
  emptyText: { color: theme.color.muted, fontSize: 14, textAlign: 'center' },
  emptyBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: theme.radius.sm, backgroundColor: theme.color.brand, marginTop: theme.spacing.sm },
  emptyBtnText: { color: theme.color.onBrandPrimary, fontSize: 13 },

  signOff: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, marginTop: theme.spacing.xxxl, paddingHorizontal: theme.spacing.xl },
  signOffLine: { flex: 1, height: 1, backgroundColor: theme.color.border },
  signOffText: { fontSize: 10, color: theme.color.muted, letterSpacing: 1.5, textTransform: 'uppercase' },
});
