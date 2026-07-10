import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, useWindowDimensions, FlatList, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown, useSharedValue, useAnimatedStyle, withSpring, withSequence, withTiming } from 'react-native-reanimated';
import { api } from '@/src/api';
import { useAuth } from '@/src/auth';
import { theme } from '@/src/theme';
import { Skeleton } from '@/src/components/Skeleton';

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
  const heartScale = useSharedValue(1);
  const heartAnim = useAnimatedStyle(() => ({ transform: [{ scale: heartScale.value }] }));

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
    heartScale.value = withSequence(withTiming(1.35, { duration: 150 }), withSpring(1, { damping: 8 }));
    try {
      if (inWishlist) { await api.removeWishlist(id!); setInWishlist(false); }
      else { await api.addWishlist(id!); setInWishlist(true); Haptics.selectionAsync().catch(() => {}); }
    } catch (e: any) { showToast(e.message || 'Could not update wishlist'); }
  };

  if (loading || !product) {
    return (
      <SafeAreaView style={styles.safe}>
        <Skeleton width={width} height={width} radius={0} />
        <View style={{ padding: theme.spacing.xl, gap: 12 }}>
          <Skeleton width={80} height={10} />
          <Skeleton width={'75%'} height={26} />
          <Skeleton width={100} height={22} />
          <View style={{ height: 12 }} />
          <Skeleton width={'100%'} height={12} />
          <Skeleton width={'92%'} height={12} />
          <Skeleton width={'70%'} height={12} />
        </View>
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
              <Animated.View style={heartAnim}>
                <Feather name="heart" size={20} color={inWishlist ? theme.color.brand : theme.color.onSurface} />
              </Animated.View>
            </Pressable>
          </SafeAreaView>
        </View>

        <Animated.View entering={FadeInDown.duration(500)} style={styles.body}>
          <View style={styles.kickerRow}>
            <View style={styles.kickerDot} />
            <Text style={styles.kicker}>{product.category?.toUpperCase()}</Text>
          </View>
          <Text style={styles.title}>{product.title}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.price}>${product.price.toFixed(0)}</Text>
            <View style={styles.rating}>
              <Feather name="star" size={13} color={theme.color.warning} />
              <Text style={styles.ratingText}>{(product.rating || 0).toFixed(1)} ({product.review_count || 0})</Text>
            </View>
          </View>

          <Pressable
            testID="meet-the-maker"
            onPress={() => product.seller_id && router.push(`/seller/${product.seller_id}`)}
            style={styles.artisanRow}
          >
            <View style={styles.artisanAvatar}>
              <Text style={styles.artisanAvatarText}>{(product.seller_name || '?').charAt(0)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.artisanKicker}>Made by</Text>
              <View style={styles.artisanNameRow}>
                <Text style={styles.artisan}>{product.seller_name}</Text>
                {product.seller_verified && (
                  <View style={styles.verifiedBadge} testID="verified-badge">
                    <Feather name="check" size={10} color={theme.color.onSuccess} />
                    <Text style={styles.verifiedText}>VERIFIED</Text>
                  </View>
                )}
              </View>
            </View>
            <Feather name="arrow-right" size={16} color={theme.color.muted} />
          </Pressable>

          <View style={styles.divider} />

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
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                  <Text style={styles.reviewName}>{r.user_name}</Text>
                  {r.verified_purchase && (
                    <View style={styles.verifiedPurchase}>
                      <Text style={styles.verifiedPurchaseText}>VERIFIED PURCHASE</Text>
                    </View>
                  )}
                </View>
                <View style={styles.rating}>
                  <Feather name="star" size={11} color={theme.color.warning} />
                  <Text style={styles.ratingText}>{r.rating}</Text>
                </View>
              </View>
              {r.comment ? <Text style={styles.reviewText}>{r.comment}</Text> : null}
            </View>
          ))}
        </Animated.View>
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.stickyBar}>
        <View style={styles.stickyLeft}>
          <Text style={styles.stickyPriceLabel}>Total</Text>
          <Text style={styles.stickyPrice}>${product.price.toFixed(0)}</Text>
        </View>
        <Pressable testID="add-to-cart-btn" onPress={addCart} disabled={busy} style={styles.cta}>
          {busy ? (
            <Feather name="loader" size={18} color="#fff" />
          ) : (
            <>
              <Feather name="shopping-bag" size={16} color="#fff" />
              <Text style={styles.ctaText}>Add to cart</Text>
            </>
          )}
        </Pressable>
      </SafeAreaView>

      {toast && (
        <Animated.View entering={FadeIn.duration(200)} style={styles.toast} testID="toast">
          <Feather name="check-circle" size={14} color="#fff" />
          <Text style={styles.toastText}>{toast}</Text>
        </Animated.View>
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
  circleBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(250,249,246,0.95)', alignItems: 'center', justifyContent: 'center', ...theme.elevation.subtle },
  heroImg: { backgroundColor: theme.color.surfaceTertiary },
  dots: { position: 'absolute', bottom: 16, alignSelf: 'center', flexDirection: 'row', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.55)' },
  dotActive: { backgroundColor: '#fff', width: 20 },
  body: { padding: theme.spacing.xl, paddingTop: theme.spacing.xxl, backgroundColor: theme.color.surface, marginTop: -20, borderTopLeftRadius: theme.radius.lg, borderTopRightRadius: theme.radius.lg },
  kickerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: theme.spacing.sm },
  kickerDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.color.brand },
  kicker: { fontSize: 10, letterSpacing: 2.5, color: theme.color.muted },
  title: { fontFamily: theme.font.heading, fontSize: 30, color: theme.color.onSurface, lineHeight: 36, letterSpacing: -0.3 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: theme.spacing.md },
  price: { fontFamily: theme.font.heading, fontSize: 28, color: theme.color.brand, letterSpacing: -0.3 },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 13, color: theme.color.muted },
  artisanRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, marginTop: theme.spacing.lg, padding: theme.spacing.md, borderRadius: theme.radius.md, backgroundColor: theme.color.surfaceSecondary, borderWidth: 1, borderColor: theme.color.border },
  artisanAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.color.brandTertiary, alignItems: 'center', justifyContent: 'center' },
  artisanAvatarText: { fontFamily: theme.font.heading, fontSize: 18, color: theme.color.brand },
  artisanKicker: { fontSize: 10, letterSpacing: 1.5, color: theme.color.muted, textTransform: 'uppercase' },
  artisanNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  artisan: { color: theme.color.onSurface, fontSize: 14, fontWeight: '500' },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: theme.radius.sm, backgroundColor: theme.color.success },
  verifiedText: { color: theme.color.onSuccess, fontSize: 9, letterSpacing: 1 },
  divider: { height: 1, backgroundColor: theme.color.divider, marginTop: theme.spacing.xl },
  section: { fontFamily: theme.font.heading, fontSize: 20, color: theme.color.onSurface, marginTop: theme.spacing.xl, marginBottom: theme.spacing.md, letterSpacing: -0.2 },
  desc: { fontSize: 15, lineHeight: 24, color: theme.color.onSurface },
  specs: { marginTop: theme.spacing.xl, paddingVertical: theme.spacing.md, borderTopWidth: 1, borderBottomWidth: 1, borderColor: theme.color.divider },
  specRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  specLabel: { fontSize: 13, color: theme.color.muted },
  specVal: { fontSize: 13, color: theme.color.onSurface },
  review: { paddingVertical: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.color.divider },
  reviewName: { fontSize: 14, color: theme.color.onSurface },
  reviewText: { fontSize: 13, color: theme.color.onSurfaceTertiary, marginTop: 4 },
  verifiedPurchase: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: theme.radius.sm, backgroundColor: theme.color.brandTertiary },
  verifiedPurchaseText: { color: theme.color.onBrandTertiary, fontSize: 9, letterSpacing: 1 },
  emptyDim: { color: theme.color.muted, fontSize: 13 },
  stickyBar: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: theme.color.surfaceSecondary, paddingHorizontal: theme.spacing.xl, paddingTop: theme.spacing.md, borderTopWidth: 1, borderTopColor: theme.color.border, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, ...theme.elevation.lift },
  stickyLeft: {},
  stickyPriceLabel: { fontSize: 10, color: theme.color.muted, letterSpacing: 1.5, textTransform: 'uppercase' },
  stickyPrice: { fontFamily: theme.font.heading, fontSize: 22, color: theme.color.onSurface, marginTop: 2 },
  cta: { flex: 1, backgroundColor: theme.color.brand, paddingVertical: 14, borderRadius: theme.radius.sm, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  ctaText: { color: '#fff', fontSize: 15, letterSpacing: 0.3 },
  toast: { position: 'absolute', top: 100, alignSelf: 'center', backgroundColor: theme.color.surfaceInverse, paddingHorizontal: 16, paddingVertical: 10, borderRadius: theme.radius.pill, flexDirection: 'row', alignItems: 'center', gap: 6, ...theme.elevation.lift },
  toastText: { color: '#fff', fontSize: 13 },
});
