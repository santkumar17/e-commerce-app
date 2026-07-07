import { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '@/src/api';
import { theme } from '@/src/theme';

export default function Search() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await api.products(q ? { q } : {});
        setItems(r);
      } finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Search</Text>
        <View style={styles.searchWrap}>
          <Feather name="search" size={16} color={theme.color.muted} />
          <TextInput
            testID="search-input"
            value={q}
            onChangeText={setQ}
            placeholder="Search handmade goods..."
            placeholderTextColor={theme.color.muted}
            style={styles.searchInput}
          />
        </View>
      </View>
      {loading ? (
        <ActivityIndicator color={theme.color.brand} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: theme.spacing.xl, paddingBottom: theme.spacing.xxxl }}
          ListEmptyComponent={<Text style={styles.empty}>Nothing found. Try another word.</Text>}
          renderItem={({ item }) => (
            <Pressable
              testID={`search-result-${item.id}`}
              onPress={() => router.push(`/product/${item.id}`)}
              style={styles.row}
            >
              <Image
                source={{ uri: item.images?.[0] || 'https://images.unsplash.com/photo-1449247709967-d4461a6a6103?w=200' }}
                style={styles.rowImg}
                contentFit="cover"
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.rowPrice}>${item.price.toFixed(0)}</Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.color.surface },
  header: { padding: theme.spacing.xl, paddingBottom: theme.spacing.lg },
  title: { fontFamily: theme.font.heading, fontSize: 28, color: theme.color.onSurface, marginBottom: theme.spacing.lg },
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: theme.radius.sm, borderWidth: 1, borderColor: theme.color.border, paddingHorizontal: 12, backgroundColor: theme.color.surfaceSecondary },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: theme.color.onSurface },
  row: { flexDirection: 'row', gap: theme.spacing.md, paddingVertical: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.color.divider },
  rowImg: { width: 76, height: 76, borderRadius: theme.radius.sm, backgroundColor: theme.color.surfaceTertiary },
  rowTitle: { fontSize: 15, color: theme.color.onSurface },
  rowPrice: { fontFamily: theme.font.heading, fontSize: 16, color: theme.color.brand, marginTop: 4 },
  empty: { textAlign: 'center', color: theme.color.muted, marginTop: 40 },
});
