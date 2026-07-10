import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { api } from '@/src/api';
import { theme } from '@/src/theme';
import { statusColor } from '@/src/utils/status';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { Skeleton } from '@/src/components/Skeleton';
import { AnimatedPressable } from '@/src/components/AnimatedPressable';

export default function Orders() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(await api.orders()); } finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const cancel = async (id: string) => {
    try { await api.setOrderStatus(id, 'cancelled'); await load(); }
    catch (e: any) { setErr(e.message || 'Could not cancel order'); }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="My Orders" />
      {loading ? (
        <View style={{ paddingHorizontal: theme.spacing.xl, gap: theme.spacing.md }}>
          {[0, 1].map((i) => (
            <View key={i} style={styles.card}>
              <Skeleton width={80} height={10} />
              <View style={{ height: 10 }} />
              <Skeleton width="100%" height={44} radius={theme.radius.sm} />
              <View style={{ height: 8 }} />
              <Skeleton width="100%" height={44} radius={theme.radius.sm} />
            </View>
          ))}
        </View>
      ) : (
        <>
          {err && <Text style={styles.err} testID="orders-error">{err}</Text>}
          <FlatList
            data={items}
            keyExtractor={(i) => i.id}
            contentContainerStyle={{ padding: theme.spacing.xl, paddingBottom: theme.spacing.xxxl }}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Feather name="package" size={32} color={theme.color.muted} />
                <Text style={styles.emptyText}>No orders yet.</Text>
                <AnimatedPressable testID="orders-empty-browse" onPress={() => router.push('/(customer)/home')} style={styles.emptyBtn}>
                  <Text style={styles.emptyBtnText}>Browse products</Text>
                </AnimatedPressable>
              </View>
            }
            renderItem={({ item, index }) => (
              <Animated.View entering={FadeInUp.delay(Math.min(index, 8) * 50).duration(350)} style={styles.card} testID={`order-${item.id}`}>
                <View style={styles.cardHead}>
                  <Text style={styles.orderId}>#{item.id.slice(0, 8)}</Text>
                  <View style={[styles.badge, statusColor(item.status)]}>
                    <Text style={styles.badgeText}>{item.status.toUpperCase()}</Text>
                  </View>
                </View>
                {item.items.slice(0, 3).map((it: any, idx: number) => (
                  <View key={idx} style={styles.line}>
                    <Image source={{ uri: it.image }} style={styles.lineImg} contentFit="cover" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.lineTitle} numberOfLines={1}>{it.title}</Text>
                      <Text style={styles.lineMeta}>Qty {it.qty} · ${it.price.toFixed(0)}</Text>
                    </View>
                    {item.status === 'delivered' && (
                      <AnimatedPressable
                        testID={`rate-item-${item.id}-${it.product_id}`}
                        onPress={() => router.push({ pathname: '/review/[product_id]', params: { product_id: it.product_id, order_id: item.id, title: it.title } })}
                        style={styles.rateBtn}
                      >
                        <Feather name="star" size={12} color={theme.color.brand} />
                        <Text style={styles.rateText}>Rate</Text>
                      </AnimatedPressable>
                    )}
                  </View>
                ))}
                {item.discount && item.discount > 0 ? (
                  <Text style={styles.discountLine} testID={`order-discount-${item.id}`}>
                    {item.coupon_code} · saved ${item.discount.toFixed(2)}
                  </Text>
                ) : null}
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total (COD)</Text>
                  <Text style={styles.totalVal}>${item.total.toFixed(2)}</Text>
                </View>
                {item.status === 'placed' && (
                  <AnimatedPressable
                    testID={`cancel-order-${item.id}`}
                    onPress={() => cancel(item.id)}
                    style={styles.cancelBtn}
                  >
                    <Text style={styles.cancelText}>Cancel order</Text>
                  </AnimatedPressable>
                )}
              </Animated.View>
            )}
          />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.color.surface },
  err: { color: theme.color.error, marginHorizontal: theme.spacing.xl, fontSize: 13 },
  card: { backgroundColor: theme.color.surfaceSecondary, borderRadius: theme.radius.md, padding: theme.spacing.lg, marginBottom: theme.spacing.md, borderWidth: 1, borderColor: theme.color.border },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.md },
  orderId: { fontSize: 12, color: theme.color.muted, letterSpacing: 1 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: theme.radius.pill },
  badgeText: { fontSize: 10, color: theme.color.onSurface, letterSpacing: 1 },
  line: { flexDirection: 'row', gap: theme.spacing.md, alignItems: 'center', marginBottom: theme.spacing.sm },
  lineImg: { width: 44, height: 44, borderRadius: theme.radius.sm, backgroundColor: theme.color.surfaceTertiary },
  lineTitle: { fontSize: 13, color: theme.color.onSurface },
  lineMeta: { fontSize: 11, color: theme.color.muted, marginTop: 2 },
  rateBtn: { flexDirection: 'row', gap: 4, alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: theme.radius.pill, borderWidth: 1, borderColor: theme.color.brand, backgroundColor: theme.color.brandTertiary },
  rateText: { fontSize: 11, color: theme.color.brand, fontFamily: theme.font.bodyMedium },
  discountLine: { fontSize: 11, color: theme.color.success, marginTop: theme.spacing.sm },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: theme.spacing.md, paddingTop: theme.spacing.md, borderTopWidth: 1, borderTopColor: theme.color.divider },
  totalLabel: { fontSize: 13, color: theme.color.muted },
  totalVal: { fontFamily: theme.font.heading, fontSize: 18, color: theme.color.onSurface },
  cancelBtn: { marginTop: theme.spacing.md, paddingVertical: 10, borderRadius: theme.radius.sm, borderWidth: 1, borderColor: theme.color.error, alignItems: 'center' },
  cancelText: { color: theme.color.error, fontSize: 13 },
  empty: { alignItems: 'center', padding: theme.spacing.xxxl, gap: theme.spacing.md },
  emptyText: { color: theme.color.muted },
  emptyBtn: { marginTop: theme.spacing.sm, paddingHorizontal: 20, paddingVertical: 12, borderRadius: theme.radius.sm, backgroundColor: theme.color.brand },
  emptyBtnText: { color: theme.color.onBrandPrimary, fontSize: 14 },
});
