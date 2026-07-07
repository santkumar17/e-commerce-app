import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { api } from '@/src/api';
import { theme } from '@/src/theme';

export default function Wishlist() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(await api.wishlist()); } finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const remove = async (id: string) => {
    await api.removeWishlist(id);
    load();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Text style={styles.title}>Wishlist</Text>
      {loading ? <ActivityIndicator color={theme.color.brand} style={{ marginTop: 40 }} /> : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: theme.spacing.xl, paddingBottom: theme.spacing.xxxl }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="heart" size={32} color={theme.color.muted} />
              <Text style={styles.emptyText}>Nothing saved yet.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              testID={`wishlist-item-${item.id}`}
              onPress={() => router.push(`/product/${item.id}`)}
              style={styles.row}
            >
              <Image source={{ uri: item.images?.[0] }} style={styles.rowImg} contentFit="cover" />
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.rowPrice}>${item.price.toFixed(0)}</Text>
              </View>
              <Pressable testID={`wishlist-remove-${item.id}`} onPress={() => remove(item.id)} hitSlop={12}>
                <Feather name="x" size={20} color={theme.color.muted} />
              </Pressable>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.color.surface },
  title: { fontFamily: theme.font.heading, fontSize: 28, color: theme.color.onSurface, padding: theme.spacing.xl, paddingBottom: theme.spacing.md },
  row: { flexDirection: 'row', gap: theme.spacing.md, alignItems: 'center', paddingVertical: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.color.divider },
  rowImg: { width: 68, height: 68, borderRadius: theme.radius.sm, backgroundColor: theme.color.surfaceTertiary },
  rowTitle: { fontSize: 15, color: theme.color.onSurface },
  rowPrice: { fontFamily: theme.font.heading, fontSize: 16, color: theme.color.brand, marginTop: 4 },
  empty: { alignItems: 'center', padding: theme.spacing.xxxl, gap: theme.spacing.md },
  emptyText: { color: theme.color.muted },
});
