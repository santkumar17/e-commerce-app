import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { api } from '@/src/api';
import { theme } from '@/src/theme';

export default function Orders() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(await api.orders()); } finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const cancel = async (id: string) => {
    await api.setOrderStatus(id, 'cancelled');
    load();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Text style={styles.title}>My Orders</Text>
      {loading ? <ActivityIndicator color={theme.color.brand} style={{ marginTop: 40 }} /> : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: theme.spacing.xl, paddingBottom: theme.spacing.xxxl }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="package" size={32} color={theme.color.muted} />
              <Text style={styles.emptyText}>No orders yet.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card} testID={`order-${item.id}`}>
              <View style={styles.cardHead}>
                <Text style={styles.orderId}>#{item.id.slice(0, 8)}</Text>
                <View style={[styles.badge, statusStyle(item.status)]}>
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
                    <Pressable
                      testID={`rate-item-${item.id}-${it.product_id}`}
                      onPress={() => router.push({ pathname: '/review/[product_id]', params: { product_id: it.product_id, order_id: item.id, title: it.title } })}
                      style={styles.rateBtn}
                    >
                      <Feather name="star" size={12} color={theme.color.brand} />
                      <Text style={styles.rateText}>Rate</Text>
                    </Pressable>
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
                <Pressable
                  testID={`cancel-order-${item.id}`}
                  onPress={() => cancel(item.id)}
                  style={styles.cancelBtn}
                >
                  <Text style={styles.cancelText}>Cancel order</Text>
                </Pressable>
              )}
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

function statusStyle(s: string) {
  if (s === 'delivered') return { backgroundColor: '#DDEADD' };
  if (s === 'shipped') return { backgroundColor: '#EAE0D0' };
  if (s === 'cancelled') return { backgroundColor: '#F0DADA' };
  return { backgroundColor: theme.color.surfaceTertiary };
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.color.surface },
  title: { fontFamily: theme.font.heading, fontSize: 28, color: theme.color.onSurface, padding: theme.spacing.xl, paddingBottom: theme.spacing.md },
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
  rateText: { fontSize: 11, color: theme.color.brand, fontWeight: '500' },
  discountLine: { fontSize: 11, color: theme.color.success, marginTop: theme.spacing.sm },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: theme.spacing.md, paddingTop: theme.spacing.md, borderTopWidth: 1, borderTopColor: theme.color.divider },
  totalLabel: { fontSize: 13, color: theme.color.muted },
  totalVal: { fontFamily: theme.font.heading, fontSize: 18, color: theme.color.onSurface },
  cancelBtn: { marginTop: theme.spacing.md, paddingVertical: 10, borderRadius: theme.radius.sm, borderWidth: 1, borderColor: theme.color.error, alignItems: 'center' },
  cancelText: { color: theme.color.error, fontSize: 13 },
  empty: { alignItems: 'center', padding: theme.spacing.xxxl, gap: theme.spacing.md },
  emptyText: { color: theme.color.muted },
});
