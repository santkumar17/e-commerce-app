import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { api } from '@/src/api';
import { theme } from '@/src/theme';

const ICONS: Record<string, any> = {
  product_approved: 'check-circle',
  product_rejected: 'alert-circle',
  new_order: 'shopping-bag',
  order_status: 'package',
  seller_verified: 'award',
  seller_unverified: 'x-circle',
};

const COLORS: Record<string, string> = {
  product_approved: theme.color.success,
  product_rejected: theme.color.error,
  new_order: theme.color.brand,
  order_status: theme.color.info,
  seller_verified: theme.color.success,
  seller_unverified: theme.color.error,
};

function timeAgo(iso: string) {
  const now = Date.now();
  const t = new Date(iso).getTime();
  const s = Math.max(0, Math.floor((now - t) / 1000));
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function Notifications() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.notifications();
      setItems(r.items || []);
      setUnread(r.unread || 0);
    } finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onTap = async (n: any) => {
    if (!n.read) {
      await api.markNotifRead(n.id);
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      setUnread((u) => Math.max(0, u - 1));
    }
    // route by type
    if (n.type === 'new_order' || n.type === 'order_status') {
      router.push('/(customer)/orders');
    } else if (n.type === 'product_approved' || n.type === 'product_rejected') {
      router.push('/(seller)/dashboard');
    }
  };

  const markAll = async () => {
    await api.markAllNotifRead();
    setItems((prev) => prev.map((x) => ({ ...x, read: true })));
    setUnread(0);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable testID="notif-back" onPress={() => router.back()} hitSlop={12}>
          <Feather name="arrow-left" size={22} color={theme.color.onSurface} />
        </Pressable>
        <Text style={styles.headerTitle}>Inbox</Text>
        {unread > 0 && (
          <Pressable testID="mark-all-read" onPress={markAll}>
            <Text style={styles.markAll}>Mark all read</Text>
          </Pressable>
        )}
      </View>

      {loading ? (
        <ActivityIndicator color={theme.color.brand} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ paddingHorizontal: theme.spacing.xl, paddingBottom: theme.spacing.xxxl }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="bell" size={32} color={theme.color.muted} />
              <Text style={styles.emptyText}>Nothing yet.</Text>
              <Text style={styles.emptyDim}>Approvals, orders, and updates will land here.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              testID={`notif-${item.id}`}
              onPress={() => onTap(item)}
              style={[styles.card, !item.read && styles.cardUnread]}
            >
              <View style={[styles.icon, { backgroundColor: (COLORS[item.type] || theme.color.brand) + '22' }]}>
                <Feather name={ICONS[item.type] || 'bell'} size={16} color={COLORS[item.type] || theme.color.brand} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, !item.read && { fontWeight: '600' }]}>{item.title}</Text>
                <Text style={styles.body} numberOfLines={2}>{item.body}</Text>
                <Text style={styles.time}>{timeAgo(item.created_at)}</Text>
              </View>
              {!item.read && <View style={styles.dot} />}
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.color.surface },
  header: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.lg, padding: theme.spacing.xl, paddingBottom: theme.spacing.md },
  headerTitle: { fontFamily: theme.font.heading, fontSize: 24, color: theme.color.onSurface, flex: 1 },
  markAll: { color: theme.color.brand, fontSize: 13 },
  card: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, padding: theme.spacing.md, borderRadius: theme.radius.md, backgroundColor: theme.color.surfaceSecondary, borderWidth: 1, borderColor: theme.color.border, marginBottom: theme.spacing.sm },
  cardUnread: { backgroundColor: theme.color.brandTertiary, borderColor: theme.color.brand },
  icon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 14, color: theme.color.onSurface },
  body: { fontSize: 12, color: theme.color.onSurfaceTertiary, marginTop: 2 },
  time: { fontSize: 10, color: theme.color.muted, marginTop: 4, letterSpacing: 0.5 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.color.brand },
  empty: { alignItems: 'center', gap: theme.spacing.md, paddingVertical: theme.spacing.xxxl },
  emptyText: { fontFamily: theme.font.heading, fontSize: 20, color: theme.color.onSurface },
  emptyDim: { color: theme.color.muted, fontSize: 13, textAlign: 'center', paddingHorizontal: theme.spacing.xxl },
});
