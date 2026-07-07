import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { api } from '@/src/api';
import { theme } from '@/src/theme';
import { NotifBell } from '@/src/components/NotifBell';

export default function SellerDashboard() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(await api.sellerProducts()); } finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const counts = {
    approved: items.filter((i) => i.status === 'approved').length,
    pending: items.filter((i) => i.status === 'pending').length,
    rejected: items.filter((i) => i.status === 'rejected').length,
    draft: items.filter((i) => i.status === 'draft').length,
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>Studio</Text>
          <Text style={styles.title}>Your listings</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <NotifBell color={theme.color.onSurface} onDark={false} testID="seller-notif-bell" />
          <Pressable testID="add-product-btn" onPress={() => router.push('/seller/product-form')} style={styles.addBtn}>
            <Feather name="plus" size={18} color="#fff" />
          </Pressable>
        </View>
      </View>

      <View style={styles.statsRow}>
        <Stat label="Live" value={counts.approved} color={theme.color.success} testID="stat-approved" />
        <Stat label="Pending" value={counts.pending} color={theme.color.warning} testID="stat-pending" />
        <Stat label="Drafts" value={counts.draft} color={theme.color.info} testID="stat-draft" />
        <Stat label="Rejected" value={counts.rejected} color={theme.color.error} testID="stat-rejected" />
      </View>

      {loading ? <ActivityIndicator color={theme.color.brand} style={{ marginTop: 40 }} /> : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: theme.spacing.xl, paddingBottom: theme.spacing.xxxl }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="package" size={32} color={theme.color.muted} />
              <Text style={styles.emptyText}>List your first creation.</Text>
              <Pressable testID="empty-add-btn" onPress={() => router.push('/seller/product-form')} style={styles.emptyBtn}>
                <Text style={styles.emptyBtnText}>Add product</Text>
              </Pressable>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              testID={`seller-product-${item.id}`}
              onPress={() => router.push({ pathname: '/seller/product-form', params: { id: item.id } })}
              style={styles.card}
            >
              <Image source={{ uri: item.images?.[0] }} style={styles.cardImg} contentFit="cover" />
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.cardPrice}>${item.price.toFixed(0)}</Text>
                <View style={[styles.badge, statusBg(item.status)]}>
                  <Text style={styles.badgeText}>{item.status.toUpperCase()}</Text>
                </View>
                {item.status === 'rejected' && item.rejection_reason ? (
                  <Text style={styles.rejectMsg}>Feedback: {item.rejection_reason}</Text>
                ) : null}
              </View>
              <Feather name="chevron-right" size={18} color={theme.color.muted} />
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

function Stat({ label, value, color, testID }: any) {
  return (
    <View style={styles.stat} testID={testID}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function statusBg(s: string) {
  if (s === 'approved') return { backgroundColor: '#DDEADD' };
  if (s === 'pending') return { backgroundColor: '#EAE0D0' };
  if (s === 'rejected') return { backgroundColor: '#F0DADA' };
  if (s === 'draft') return { backgroundColor: '#E6E1D8' };
  return { backgroundColor: theme.color.surfaceTertiary };
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.color.surface },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', padding: theme.spacing.xl, paddingBottom: theme.spacing.md },
  kicker: { fontSize: 11, letterSpacing: 2, color: theme.color.muted },
  title: { fontFamily: theme.font.heading, fontSize: 30, color: theme.color.onSurface, marginTop: 2 },
  addBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.color.brand, alignItems: 'center', justifyContent: 'center' },
  statsRow: { flexDirection: 'row', gap: theme.spacing.md, paddingHorizontal: theme.spacing.xl, marginTop: theme.spacing.md },
  stat: { flex: 1, padding: theme.spacing.md, borderRadius: theme.radius.md, backgroundColor: theme.color.surfaceSecondary, borderWidth: 1, borderColor: theme.color.border, alignItems: 'center' },
  statValue: { fontFamily: theme.font.heading, fontSize: 24 },
  statLabel: { fontSize: 11, color: theme.color.muted, textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 },
  card: { flexDirection: 'row', gap: theme.spacing.md, alignItems: 'center', padding: theme.spacing.md, backgroundColor: theme.color.surfaceSecondary, borderWidth: 1, borderColor: theme.color.border, borderRadius: theme.radius.md, marginBottom: theme.spacing.md },
  cardImg: { width: 68, height: 68, borderRadius: theme.radius.sm, backgroundColor: theme.color.surfaceTertiary },
  cardTitle: { fontSize: 14, color: theme.color.onSurface },
  cardPrice: { fontFamily: theme.font.heading, fontSize: 16, color: theme.color.brand, marginTop: 2 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: theme.radius.pill, marginTop: 6 },
  badgeText: { fontSize: 10, letterSpacing: 1, color: theme.color.onSurface },
  rejectMsg: { fontSize: 11, color: theme.color.error, marginTop: 6 },
  empty: { alignItems: 'center', padding: theme.spacing.xxxl, gap: theme.spacing.md },
  emptyText: { color: theme.color.muted, marginTop: theme.spacing.sm },
  emptyBtn: { marginTop: theme.spacing.md, paddingHorizontal: 20, paddingVertical: 12, borderRadius: theme.radius.sm, backgroundColor: theme.color.brand },
  emptyBtnText: { color: '#fff', fontSize: 14 },
});
