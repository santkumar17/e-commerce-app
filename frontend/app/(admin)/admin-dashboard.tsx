import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { api } from '@/src/api';
import { theme } from '@/src/theme';

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { setStats(await api.adminStats()); } finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing.xl, paddingBottom: theme.spacing.xxxl }}>
        <Text style={styles.kicker}>Marketplace</Text>
        <Text style={styles.title}>Overview</Text>

        {loading || !stats ? (
          <ActivityIndicator color={theme.color.brand} style={{ marginTop: 40 }} />
        ) : (
          <>
            <View style={styles.row}>
              <Card label="Products" value={stats.products_total} testID="stat-products" />
              <Card label="Pending" value={stats.products_pending} accent testID="stat-pending" />
            </View>
            <View style={styles.row}>
              <Card label="Approved" value={stats.products_approved} testID="stat-approved" />
              <Card label="Rejected" value={stats.products_rejected} testID="stat-rejected" />
            </View>
            <View style={styles.row}>
              <Card label="Sellers" value={stats.sellers} testID="stat-sellers" />
              <Card label="Customers" value={stats.customers} testID="stat-customers" />
            </View>
            <View style={styles.row}>
              <Card label="Orders" value={stats.orders} big testID="stat-orders" />
            </View>

            <Text style={styles.section}>Manage</Text>
            <Pressable testID="nav-coupons" onPress={() => router.push('/admin/coupons')} style={styles.linkCard}>
              <Feather name="tag" size={20} color={theme.color.brand} />
              <View style={{ flex: 1 }}>
                <Text style={styles.linkTitle}>Coupons</Text>
                <Text style={styles.linkSub}>Create promo codes for customers</Text>
              </View>
              <Feather name="chevron-right" size={18} color={theme.color.muted} />
            </Pressable>
            <Pressable testID="nav-sellers" onPress={() => router.push('/admin/sellers')} style={styles.linkCard}>
              <Feather name="award" size={20} color={theme.color.brand} />
              <View style={{ flex: 1 }}>
                <Text style={styles.linkTitle}>Sellers</Text>
                <Text style={styles.linkSub}>Verify artisans and view listings count</Text>
              </View>
              <Feather name="chevron-right" size={18} color={theme.color.muted} />
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Card({ label, value, accent, big, testID }: any) {
  return (
    <View testID={testID} style={[styles.card, accent && styles.cardAccent, big && { flex: 1 }]}>
      <Text style={[styles.cardValue, accent && { color: '#fff' }]}>{value}</Text>
      <Text style={[styles.cardLabel, accent && { color: '#fff', opacity: 0.9 }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.color.surface },
  kicker: { fontSize: 11, letterSpacing: 2, color: theme.color.muted },
  title: { fontFamily: theme.font.heading, fontSize: 30, color: theme.color.onSurface, marginTop: 2, marginBottom: theme.spacing.xl },
  row: { flexDirection: 'row', gap: theme.spacing.md, marginBottom: theme.spacing.md },
  card: { flex: 1, padding: theme.spacing.xl, borderRadius: theme.radius.md, backgroundColor: theme.color.surfaceSecondary, borderWidth: 1, borderColor: theme.color.border },
  cardAccent: { backgroundColor: theme.color.brand, borderColor: theme.color.brand },
  cardValue: { fontFamily: theme.font.heading, fontSize: 32, color: theme.color.onSurface },
  cardLabel: { color: theme.color.muted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 },
  section: { fontFamily: theme.font.heading, fontSize: 20, color: theme.color.onSurface, marginTop: theme.spacing.xl, marginBottom: theme.spacing.md },
  linkCard: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, padding: theme.spacing.lg, backgroundColor: theme.color.surfaceSecondary, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.color.border, marginBottom: theme.spacing.sm },
  linkTitle: { fontSize: 15, color: theme.color.onSurface },
  linkSub: { fontSize: 12, color: theme.color.muted, marginTop: 2 },
});
