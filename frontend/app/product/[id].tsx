import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, useWindowDimensions, FlatList, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { api } from '@/src/api';
import { useAuth } from '@/src/auth';
import { theme } from '@/src/theme';

export default function ProductDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const [product, setProduct] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [inWishlist, setInWishlist] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [activeImg, setActiveImg] = useState(0);
  const galleryRef = useRef<FlatList>(null);

  useEffect(() => {
    (async () => {
      try {
        const [p, r] = await Promise.all([api.product(id!), api.reviews(id!)]);
        setProduct(p);
        setReviews(r);
        if (user?.role === 'customer') {
          const wl = await api.wishlist();
          setInWishlist(wl.some((x: any) => x.id === id));
        }
      } finally { setLoading(false); }
    })();
  }, [id, user]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  };

  const addCart = async () => {
    if (!user) { router.push('/login'); return; }
    if (user.role !== 'customer') { showToast('Sign in as customer to buy.'); return; }
    setBusy(true);
    try {
      await api.addToCart(id!, 1);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      showToast('Added to cart');
    } catch (e: any) { showToast(e.message); } finally { setBusy(false); }
  };

  const toggleWishlist = async () => {
    if (!user || user.role !== 'customer') { router.push('/login'); return; }
    try {
      if (inWishlist) { await api.removeWishlist(id!); setInWishlist(false); }
      else { await api.addWishlist(id!); setInWishlist(true); Haptics.selectionAsync().catch(() => {}); }
    } catch { }
  };

  if (loading || !product) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color={theme.color.brand} style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  const gallery: string[] =
    product.images && product.images.length > 0
      ? product.images
      : ['https://images.unsplash.com/photo-1449247709967-d4461a6a6103?w=800'];

  const onGalleryScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== activeImg) setActiveImg(i);
  };

  return (
    <View style={styles.safe}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={{ position: 'relative' }}>
          <FlatList
            ref={galleryRef}
            testID="product-gallery"
            data={gallery}
            keyExtractor={(_, i) => String(i)}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onGalleryScroll}
            scrollEventThrottle={32}
            renderItem={({ item, index }) => (
              <Image
                testID={`product-image-${index}`}
                source={{ uri: item }}
                style={[styles.heroImg, { width, height: width }]}
                contentFit="cover"
              />
            )}
          />
          {gallery.length > 1 && (
            <View style={styles.dots} testID="gallery-dots">
              {gallery.map((_, i) => (
                <View key={i} style={[styles.dot, i === activeImg && styles.dotActive]} />
              ))}
            </View>
          )}
          <SafeAreaView style={styles.headerOverlay} edges={['top']}>
            <Pressable testID="back-btn" onPress={() => router.back()} style={styles.circleBtn}>
              <Feather name="arrow-left" size={20} color={theme.color.onSurface} />
            </Pressable>
            <Pressable testID="wishlist-toggle" onPress={toggleWishlist} style={styles.circleBtn}>
              <Feather name="heart" size={20} color={inWishlist ? theme.color.brand : theme.color.onSurface} />
            </Pressable>
          </SafeAreaView>
        </View>

        <View style={styles.body}>
          <Text style={styles.kicker}>{product.category?.toUpperCase()}</Text>
          <Text style={styles.title}>{product.title}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.price}>${product.price.toFixed(0)}</Text>
            <View style={styles.rating}>
              <Feather name="star" size={13} color={theme.color.warning} />
              <Text style={styles.ratingText}>{(product.rating || 0).toFixed(1)} ({product.review_count || 0})</Text>
            </View>
          </View>

          <Text style={styles.artisan}>By {product.seller_name}</Text>

          <Text style={styles.section}>The story</Text>
          <Text style={styles.desc}>{product.description}</Text>

          <View style={styles.specs}>
            {product.materials ? <Spec label="Materials" value={product.materials} /> : null}
            {product.dimensions ? <Spec label="Size" value={product.dimensions} /> : null}
            <Spec label="Ships in" value={`${product.shipping_days} days`} />
            <Spec label="Stock" value={String(product.stock)} />
          </View>

          <Text style={styles.section}>Reviews</Text>
          {reviews.length === 0 ? (
            <Text style={styles.emptyDim}>No reviews yet.</Text>
          ) : reviews.map((r) => (
            <View key={r.id} style={styles.review}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={styles.reviewName}>{r.user_name}</Text>
                <View style={styles.rating}>
                  <Feather name="star" size={11} color={theme.color.warning} />
                  <Text style={styles.ratingText}>{r.rating}</Text>
                </View>
              </View>
              <Text style={styles.reviewText}>{r.comment}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.stickyBar}>
        <Pressable testID="add-to-cart-btn" onPress={addCart} disabled={busy} style={styles.cta}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>Add to cart · ${product.price.toFixed(0)}</Text>}
        </Pressable>
      </SafeAreaView>

      {toast && (
        <View style={styles.toast} testID="toast">
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}
    </View>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.specRow}>
      <Text style={styles.specLabel}>{label}</Text>
      <Text style={styles.specVal}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.color.surface },
  headerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', padding: theme.spacing.lg },
  circleBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' },
  heroImg: { backgroundColor: theme.color.surfaceTertiary },
  dots: { position: 'absolute', bottom: 12, alignSelf: 'center', flexDirection: 'row', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.55)' },
  dotActive: { backgroundColor: '#fff', width: 18 },
  body: { padding: theme.spacing.xl },
  kicker: { fontSize: 11, letterSpacing: 2, color: theme.color.muted, marginBottom: theme.spacing.sm },
  title: { fontFamily: theme.font.heading, fontSize: 28, color: theme.color.onSurface, lineHeight: 34 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: theme.spacing.md },
  price: { fontFamily: theme.font.heading, fontSize: 26, color: theme.color.brand },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 13, color: theme.color.muted },
  artisan: { color: theme.color.onSurfaceTertiary, marginTop: theme.spacing.sm, fontStyle: 'italic' },
  section: { fontFamily: theme.font.heading, fontSize: 18, color: theme.color.onSurface, marginTop: theme.spacing.xxl, marginBottom: theme.spacing.md },
  desc: { fontSize: 15, lineHeight: 24, color: theme.color.onSurface },
  specs: { marginTop: theme.spacing.xl, paddingVertical: theme.spacing.md, borderTopWidth: 1, borderBottomWidth: 1, borderColor: theme.color.divider },
  specRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  specLabel: { fontSize: 13, color: theme.color.muted },
  specVal: { fontSize: 13, color: theme.color.onSurface },
  review: { paddingVertical: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.color.divider },
  reviewName: { fontSize: 14, color: theme.color.onSurface },
  reviewText: { fontSize: 13, color: theme.color.onSurfaceTertiary, marginTop: 4 },
  emptyDim: { color: theme.color.muted, fontSize: 13 },
  stickyBar: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: theme.color.surfaceSecondary, paddingHorizontal: theme.spacing.xl, paddingTop: theme.spacing.md, borderTopWidth: 1, borderTopColor: theme.color.border },
  cta: { backgroundColor: theme.color.brand, paddingVertical: 16, borderRadius: theme.radius.sm, alignItems: 'center' },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '500' },
  toast: { position: 'absolute', top: 100, alignSelf: 'center', backgroundColor: theme.color.surfaceInverse, paddingHorizontal: 16, paddingVertical: 10, borderRadius: theme.radius.pill },
  toastText: { color: '#fff', fontSize: 13 },
});
