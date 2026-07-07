import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { api } from '@/src/api';
import { theme } from '@/src/theme';

export default function SellerOrders() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(await api.orders()); } finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const nextStatus = (s: string) => (s === 'placed' ? 'shipped' : s === 'shipped' ? 'delivered' : null);

  const advance = async (id: string, status: string) => {
    await api.setOrderStatus(id, status);
    load();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Text style={styles.title}>Incoming orders</Text>
      {loading ? <ActivityIndicator color={theme.color.brand} style={{ marginTop: 40 }} /> : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: theme.spacing.xl, paddingBottom: theme.spacing.xxxl }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="inbox" size={32} color={theme.color.muted} />
              <Text style={styles.emptyText}>No orders yet.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const next = nextStatus(item.status);
            return (
              <View style={styles.card} testID={`seller-order-${item.id}`}>
                <View style={styles.head}>
                  <Text style={styles.orderId}>#{item.id.slice(0, 8)}</Text>
                  <Text style={styles.status}>{item.status.toUpperCase()}</Text>
                </View>
                {item.items.map((it: any, idx: number) => (
                  <View key={idx} style={styles.line}>
                    <Image source={{ uri: it.image }} style={styles.lineImg} contentFit="cover" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.lineTitle} numberOfLines={1}>{it.title}</Text>
                      <Text style={styles.lineMeta}>Qty {it.qty}</Text>
                    </View>
                  </View>
                ))}
                <View style={styles.footRow}>
                  <View>
                    <Text style={styles.addrName}>{item.address.full_name}</Text>
                    <Text style={styles.addrText}>{item.address.city}, {item.address.state}</Text>
                  </View>
                  {next && (
                    <Pressable testID={`advance-${item.id}`} onPress={() => advance(item.id, next)} style={styles.advBtn}>
                      <Text style={styles.advText}>Mark {next}</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.color.surface },
  title: { fontFamily: theme.font.heading, fontSize: 28, color: theme.color.onSurface, padding: theme.spacing.xl, paddingBottom: theme.spacing.md },
  card: { backgroundColor: theme.color.surfaceSecondary, borderRadius: theme.radius.md, padding: theme.spacing.lg, marginBottom: theme.spacing.md, borderWidth: 1, borderColor: theme.color.border },
  head: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.spacing.md },
  orderId: { color: theme.color.muted, fontSize: 12, letterSpacing: 1 },
  status: { fontSize: 11, color: theme.color.onSurface, letterSpacing: 1 },
  line: { flexDirection: 'row', gap: theme.spacing.md, alignItems: 'center', marginBottom: theme.spacing.sm },
  lineImg: { width: 44, height: 44, borderRadius: theme.radius.sm, backgroundColor: theme.color.surfaceTertiary },
  lineTitle: { fontSize: 13, color: theme.color.onSurface },
  lineMeta: { fontSize: 11, color: theme.color.muted },
  footRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: theme.spacing.md, paddingTop: theme.spacing.md, borderTopWidth: 1, borderTopColor: theme.color.divider },
  addrName: { fontSize: 13, color: theme.color.onSurface },
  addrText: { fontSize: 12, color: theme.color.muted, marginTop: 2 },
  advBtn: { backgroundColor: theme.color.brand, paddingHorizontal: 14, paddingVertical: 8, borderRadius: theme.radius.sm },
  advText: { color: '#fff', fontSize: 13 },
  empty: { alignItems: 'center', padding: theme.spacing.xxxl, gap: theme.spacing.md },
  emptyText: { color: theme.color.muted },
});
