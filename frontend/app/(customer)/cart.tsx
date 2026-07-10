import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { api } from '@/src/api';
import { theme } from '@/src/theme';
import { ListRow } from '@/src/components/ListRow';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { SkeletonRow } from '@/src/components/Skeleton';
import { AnimatedPressable } from '@/src/components/AnimatedPressable';

interface CartItem { id: string; product_id: string; qty: number; product: any; }

export default function Cart() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(await api.cart()); } finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const remove = async (pid: string) => {
    try { await api.removeFromCart(pid); await load(); }
    catch (e: any) { setErr(e.message || 'Could not remove item'); }
  };

  const total = items.reduce((s, it) => s + (it.product?.price || 0) * it.qty, 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Cart" />
      {loading ? (
        <View style={{ paddingHorizontal: theme.spacing.xl }}>
          {[0, 1, 2].map((i) => <SkeletonRow key={i} />)}
        </View>
      ) : (
        <>
          {err && <Text style={styles.err} testID="cart-error">{err}</Text>}
          <FlatList
            data={items}
            keyExtractor={(i) => i.id}
            contentContainerStyle={{ padding: theme.spacing.xl, paddingBottom: 180 }}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Feather name="shopping-bag" size={32} color={theme.color.muted} />
                <Text style={styles.emptyText}>Your cart is empty.</Text>
                <AnimatedPressable testID="cart-empty-browse" onPress={() => router.push('/(customer)/home')} style={styles.emptyBtn}>
                  <Text style={styles.emptyBtnText}>Browse products</Text>
                </AnimatedPressable>
              </View>
            }
            renderItem={({ item, index }) => (
              <ListRow
                testID={`cart-item-${item.product_id}`}
                imageUri={item.product?.images?.[0]}
                title={item.product?.title}
                subtitle={`Qty ${item.qty} · $${((item.product?.price || 0) * item.qty).toFixed(0)}`}
                index={index}
                trailing={
                  <AnimatedPressable testID={`cart-remove-${item.product_id}`} onPress={() => remove(item.product_id)} hitSlop={12}>
                    <Feather name="trash-2" size={18} color={theme.color.muted} />
                  </AnimatedPressable>
                }
              />
            )}
          />
          {items.length > 0 && (
            <View style={styles.footer}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalVal} testID="cart-total">${total.toFixed(2)}</Text>
              </View>
              <AnimatedPressable testID="checkout-btn" onPress={() => router.push('/checkout')} style={styles.checkoutBtn}>
                <Text style={styles.checkoutText}>Checkout</Text>
              </AnimatedPressable>
            </View>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.color.surface },
  err: { color: theme.color.error, marginHorizontal: theme.spacing.xl, fontSize: 13 },
  empty: { alignItems: 'center', padding: theme.spacing.xxxl, gap: theme.spacing.md },
  emptyText: { color: theme.color.muted },
  emptyBtn: { marginTop: theme.spacing.sm, paddingHorizontal: 20, paddingVertical: 12, borderRadius: theme.radius.sm, backgroundColor: theme.color.brand },
  emptyBtnText: { color: theme.color.onBrandPrimary, fontSize: 14 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: theme.color.surfaceSecondary, padding: theme.spacing.xl, borderTopWidth: 1, borderTopColor: theme.color.border },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.spacing.md },
  totalLabel: { fontSize: 14, color: theme.color.muted },
  totalVal: { fontFamily: theme.font.heading, fontSize: 22, color: theme.color.onSurface },
  checkoutBtn: { backgroundColor: theme.color.brand, paddingVertical: 16, borderRadius: theme.radius.sm, alignItems: 'center' },
  checkoutText: { color: theme.color.onBrandPrimary, fontSize: 16, fontFamily: theme.font.bodyMedium },
});
