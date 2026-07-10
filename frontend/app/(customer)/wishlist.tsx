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

export default function Wishlist() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(await api.wishlist()); } finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const remove = async (id: string) => {
    try { await api.removeWishlist(id); await load(); }
    catch (e: any) { setErr(e.message || 'Could not remove item'); }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Wishlist" />
      {loading ? (
        <View style={{ paddingHorizontal: theme.spacing.xl }}>
          {[0, 1, 2].map((i) => <SkeletonRow key={i} />)}
        </View>
      ) : (
        <>
          {err && <Text style={styles.err} testID="wishlist-error">{err}</Text>}
          <FlatList
            data={items}
            keyExtractor={(i) => i.id}
            contentContainerStyle={{ padding: theme.spacing.xl, paddingBottom: theme.spacing.xxxl }}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Feather name="heart" size={32} color={theme.color.muted} />
                <Text style={styles.emptyText}>Nothing saved yet.</Text>
                <AnimatedPressable testID="wishlist-empty-browse" onPress={() => router.push('/(customer)/home')} style={styles.emptyBtn}>
                  <Text style={styles.emptyBtnText}>Browse products</Text>
                </AnimatedPressable>
              </View>
            }
            renderItem={({ item, index }) => (
              <ListRow
                testID={`wishlist-item-${item.id}`}
                imageUri={item.images?.[0]}
                title={item.title}
                subtitle={`$${item.price.toFixed(0)}`}
                onPress={() => router.push(`/product/${item.id}`)}
                index={index}
                trailing={
                  <AnimatedPressable testID={`wishlist-remove-${item.id}`} onPress={() => remove(item.id)} hitSlop={12}>
                    <Feather name="x" size={20} color={theme.color.muted} />
                  </AnimatedPressable>
                }
              />
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
  empty: { alignItems: 'center', padding: theme.spacing.xxxl, gap: theme.spacing.md },
  emptyText: { color: theme.color.muted },
  emptyBtn: { marginTop: theme.spacing.sm, paddingHorizontal: 20, paddingVertical: 12, borderRadius: theme.radius.sm, backgroundColor: theme.color.brand },
  emptyBtnText: { color: theme.color.onBrandPrimary, fontSize: 14 },
});
