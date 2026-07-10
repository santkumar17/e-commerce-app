import { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '@/src/api';
import { theme } from '@/src/theme';
import { ListRow } from '@/src/components/ListRow';
import { SkeletonRow } from '@/src/components/Skeleton';

export default function Search() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(false);

  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true);
      setErr(false);
      try {
        const r = await api.products(q ? { q } : {});
        setItems(r);
      } catch {
        setErr(true);
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
        <View style={{ paddingHorizontal: theme.spacing.xl }}>
          {[0, 1, 2, 3, 4].map((i) => <SkeletonRow key={i} />)}
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: theme.spacing.xl, paddingBottom: theme.spacing.xxxl }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name={err ? 'wifi-off' : 'search'} size={32} color={theme.color.muted} />
              <Text style={styles.emptyText}>
                {err ? 'Could not load results. Check your connection and try again.' : 'Nothing found. Try another word.'}
              </Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <ListRow
              testID={`search-result-${item.id}`}
              imageUri={item.images?.[0]}
              title={item.title}
              subtitle={`$${item.price.toFixed(0)}`}
              onPress={() => router.push(`/product/${item.id}`)}
              index={index}
            />
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
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: theme.color.onSurface, fontFamily: theme.font.body },
  empty: { alignItems: 'center', padding: theme.spacing.xxxl, gap: theme.spacing.md },
  emptyText: { textAlign: 'center', color: theme.color.muted },
});
