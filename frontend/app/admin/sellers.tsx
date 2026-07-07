import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { api } from '@/src/api';
import { theme } from '@/src/theme';

export default function AdminSellers() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(await api.adminListSellers()); } finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const toggle = async (sid: string, verified: boolean) => {
    setBusy(sid);
    try {
      await api.adminVerifySeller(sid, !verified);
      setItems((prev) => prev.map((s) => (s.id === sid ? { ...s, verified: !verified } : s)));
    } finally { setBusy(null); }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable testID="sellers-back" onPress={() => router.back()} hitSlop={12}>
          <Feather name="arrow-left" size={22} color={theme.color.onSurface} />
        </Pressable>
        <Text style={styles.headerTitle}>Sellers</Text>
      </View>
      {loading ? <ActivityIndicator color={theme.color.brand} style={{ marginTop: 40 }} /> : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: theme.spacing.xl, paddingBottom: theme.spacing.xxxl }}
          renderItem={({ item }) => (
            <View style={styles.card} testID={`admin-seller-${item.id}`}>
              <View style={{ flex: 1 }}>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{item.name}</Text>
                  {item.verified && (
                    <View style={styles.badge} testID={`badge-${item.id}`}>
                      <Feather name="check" size={10} color="#fff" />
                      <Text style={styles.badgeText}>VERIFIED</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.email}>{item.email}</Text>
                <Text style={styles.stat}>{item.products_count} listing{item.products_count === 1 ? '' : 's'}</Text>
              </View>
              <Pressable
                testID={`toggle-verify-${item.id}`}
                disabled={busy === item.id}
                onPress={() => toggle(item.id, item.verified)}
                style={[styles.actionBtn, item.verified && styles.actionBtnAlt]}
              >
                {busy === item.id ? <ActivityIndicator size="small" color={item.verified ? theme.color.error : '#fff'} /> : (
                  <Text style={[styles.actionText, item.verified && { color: theme.color.error }]}>
                    {item.verified ? 'Unverify' : 'Verify'}
                  </Text>
                )}
              </Pressable>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No sellers yet.</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.color.surface },
  header: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.lg, padding: theme.spacing.xl, paddingBottom: theme.spacing.md },
  headerTitle: { fontFamily: theme.font.heading, fontSize: 24, color: theme.color.onSurface },
  card: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, padding: theme.spacing.lg, backgroundColor: theme.color.surfaceSecondary, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.color.border, marginBottom: theme.spacing.sm },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  name: { fontFamily: theme.font.heading, fontSize: 18, color: theme.color.onSurface },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: theme.radius.sm, backgroundColor: theme.color.success },
  badgeText: { color: '#fff', fontSize: 9, letterSpacing: 1 },
  email: { fontSize: 12, color: theme.color.muted, marginTop: 2 },
  stat: { fontSize: 11, color: theme.color.brand, marginTop: 4, letterSpacing: 0.5 },
  actionBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: theme.radius.sm, backgroundColor: theme.color.brand },
  actionBtnAlt: { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.color.error },
  actionText: { color: '#fff', fontSize: 13 },
  empty: { textAlign: 'center', color: theme.color.muted, marginTop: 40 },
});
