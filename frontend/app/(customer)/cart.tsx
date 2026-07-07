import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { api } from '@/src/api';
import { theme } from '@/src/theme';

interface CartItem { id: string; product_id: string; qty: number; product: any; }

export default function Cart() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(await api.cart()); } finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const remove = async (pid: string) => {
    await api.removeFromCart(pid);
    load();
  };

  const total = items.reduce((s, it) => s + (it.product?.price || 0) * it.qty, 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Text style={styles.title}>Cart</Text>
      {loading ? <ActivityIndicator color={theme.color.brand} style={{ marginTop: 40 }} /> : (
        <>
          <FlatList
            data={items}
            keyExtractor={(i) => i.id}
            contentContainerStyle={{ padding: theme.spacing.xl, paddingBottom: 180 }}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Feather name="shopping-bag" size={32} color={theme.color.muted} />
                <Text style={styles.emptyText}>Your cart is empty.</Text>
              </View>
            }
            renderItem={({ item }) => (
              <View style={styles.row} testID={`cart-item-${item.product_id}`}>
                <Image source={{ uri: item.product?.images?.[0] }} style={styles.rowImg} contentFit="cover" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle} numberOfLines={2}>{item.product?.title}</Text>
                  <Text style={styles.qty}>Qty {item.qty}</Text>
                  <Text style={styles.rowPrice}>${((item.product?.price || 0) * item.qty).toFixed(0)}</Text>
                </View>
                <Pressable testID={`cart-remove-${item.product_id}`} onPress={() => remove(item.product_id)} hitSlop={12}>
                  <Feather name="trash-2" size={18} color={theme.color.muted} />
                </Pressable>
              </View>
            )}
          />
          {items.length > 0 && (
            <View style={styles.footer}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalVal} testID="cart-total">${total.toFixed(2)}</Text>
              </View>
              <Pressable testID="checkout-btn" onPress={() => router.push('/checkout')} style={styles.checkoutBtn}>
                <Text style={styles.checkoutText}>Checkout</Text>
              </Pressable>
            </View>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.color.surface },
  title: { fontFamily: theme.font.heading, fontSize: 28, color: theme.color.onSurface, padding: theme.spacing.xl, paddingBottom: theme.spacing.md },
  row: { flexDirection: 'row', gap: theme.spacing.md, alignItems: 'center', paddingVertical: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.color.divider },
  rowImg: { width: 76, height: 76, borderRadius: theme.radius.sm, backgroundColor: theme.color.surfaceTertiary },
  rowTitle: { fontSize: 15, color: theme.color.onSurface },
  qty: { fontSize: 12, color: theme.color.muted, marginTop: 2 },
  rowPrice: { fontFamily: theme.font.heading, fontSize: 16, color: theme.color.brand, marginTop: 4 },
  empty: { alignItems: 'center', padding: theme.spacing.xxxl, gap: theme.spacing.md },
  emptyText: { color: theme.color.muted },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: theme.color.surfaceSecondary, padding: theme.spacing.xl, borderTopWidth: 1, borderTopColor: theme.color.border },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.spacing.md },
  totalLabel: { fontSize: 14, color: theme.color.muted },
  totalVal: { fontFamily: theme.font.heading, fontSize: 22, color: theme.color.onSurface },
  checkoutBtn: { backgroundColor: theme.color.brand, paddingVertical: 16, borderRadius: theme.radius.sm, alignItems: 'center' },
  checkoutText: { color: '#fff', fontSize: 16, fontWeight: '500' },
});
