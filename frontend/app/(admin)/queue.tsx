import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { api } from '@/src/api';
import { theme } from '@/src/theme';
import { NotifBell } from '@/src/components/NotifBell';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { Skeleton } from '@/src/components/Skeleton';
import { AnimatedPressable } from '@/src/components/AnimatedPressable';

const QUICK_REASONS = [
  'Poor image quality',
  'Incomplete product information',
  'Unrealistic pricing',
  'Inappropriate content',
  'Incorrect category selection',
];

export default function AdminQueue() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [rejectItem, setRejectItem] = useState<any>(null);
  const [reason, setReason] = useState('');
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(await api.pending()); } finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const approve = async (pid: string) => {
    setBusy(pid);
    try { await api.approve(pid); await load(); }
    catch (e: any) { setErr(e.message || 'Could not approve listing'); }
    finally { setBusy(null); }
  };

  const submitReject = async () => {
    if (!rejectItem || !reason.trim()) return;
    setBusy(rejectItem.id);
    try {
      await api.reject(rejectItem.id, reason.trim());
      setRejectItem(null);
      setReason('');
      await load();
    } catch (e: any) { setErr(e.message || 'Could not reject listing'); }
    finally { setBusy(null); }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        kicker="Admin"
        title="Pending review"
        count={`${items.length} awaiting`}
        testID="pending-count"
        right={<NotifBell color={theme.color.onSurface} onDark={false} testID="admin-notif-bell" />}
      />
      {err && <Text style={styles.err}>{err}</Text>}

      {loading ? (
        <View style={{ paddingHorizontal: theme.spacing.xl, gap: theme.spacing.md }}>
          {[0, 1].map((i) => (
            <View key={i} style={styles.card}>
              <Skeleton width={100} height={120} radius={theme.radius.sm} />
              <View style={{ flex: 1, gap: 8 }}>
                <Skeleton width="50%" height={10} />
                <Skeleton width="90%" height={14} />
                <Skeleton width="40%" height={12} />
              </View>
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: theme.spacing.xl, paddingBottom: theme.spacing.xxxl }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="check-circle" size={32} color={theme.color.success} />
              <Text style={styles.emptyText}>All caught up.</Text>
              <Text style={styles.emptyDim}>No products awaiting review.</Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInUp.delay(Math.min(index, 8) * 50).duration(350)} style={styles.card} testID={`review-card-${item.id}`}>
              <Image source={{ uri: item.images?.[0] }} style={styles.cardImg} contentFit="cover" />
              <View style={styles.cardBody}>
                <Text style={styles.artisan}>{item.seller_name}</Text>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.cardPrice}>${item.price.toFixed(0)} · {item.category}</Text>
                <Text style={styles.cardDesc} numberOfLines={3}>{item.description}</Text>
                <View style={styles.actions}>
                  <AnimatedPressable
                    testID={`approve-${item.id}`}
                    onPress={() => approve(item.id)}
                    disabled={busy === item.id}
                    style={styles.approveBtn}
                  >
                    {busy === item.id ? <ActivityIndicator color={theme.color.onBrandPrimary} size="small" /> : (
                      <>
                        <Feather name="check" size={14} color={theme.color.onBrandPrimary} />
                        <Text style={styles.approveText}>Approve</Text>
                      </>
                    )}
                  </AnimatedPressable>
                  <AnimatedPressable
                    testID={`reject-${item.id}`}
                    onPress={() => setRejectItem(item)}
                    style={styles.rejectBtn}
                  >
                    <Feather name="x" size={14} color={theme.color.error} />
                    <Text style={styles.rejectText}>Reject</Text>
                  </AnimatedPressable>
                </View>
              </View>
            </Animated.View>
          )}
        />
      )}

      {/* Reject modal */}
      <Modal visible={!!rejectItem} transparent animationType="slide" onRequestClose={() => setRejectItem(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalWrap}>
          <Pressable style={styles.modalBackdrop} onPress={() => setRejectItem(null)} />
          <SafeAreaView edges={['bottom']} style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Why reject?</Text>
            <Text style={styles.sheetSub}>Provide specific, actionable feedback.</Text>

            <View style={styles.reasonsRow}>
              {QUICK_REASONS.map((r) => (
                <AnimatedPressable
                  key={r}
                  testID={`reason-${r.slice(0, 8)}`}
                  onPress={() => setReason(r)}
                  style={[styles.reasonChip, reason === r && styles.reasonChipActive]}
                >
                  <Text style={[styles.reasonText, reason === r && styles.reasonTextActive]}>{r}</Text>
                </AnimatedPressable>
              ))}
            </View>

            <TextInput
              testID="reject-reason-input"
              value={reason}
              onChangeText={setReason}
              multiline
              placeholder="Or write custom feedback..."
              placeholderTextColor={theme.color.muted}
              style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
            />
            <AnimatedPressable
              testID="reject-submit"
              onPress={submitReject}
              disabled={!reason.trim() || !!busy}
              style={[styles.rejectSubmit, (!reason.trim() || !!busy) && { opacity: 0.5 }]}
            >
              {busy ? <ActivityIndicator color={theme.color.onError} /> : <Text style={styles.rejectSubmitText}>Send rejection</Text>}
            </AnimatedPressable>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.color.surface },
  err: { color: theme.color.error, marginHorizontal: theme.spacing.xl, fontSize: 13 },
  card: { flexDirection: 'row', gap: theme.spacing.md, padding: theme.spacing.md, backgroundColor: theme.color.surfaceSecondary, borderWidth: 1, borderColor: theme.color.border, borderRadius: theme.radius.md, marginBottom: theme.spacing.md },
  cardImg: { width: 100, height: 120, borderRadius: theme.radius.sm, backgroundColor: theme.color.surfaceTertiary },
  cardBody: { flex: 1 },
  artisan: { fontSize: 11, color: theme.color.muted, letterSpacing: 1, textTransform: 'uppercase' },
  cardTitle: { fontSize: 15, color: theme.color.onSurface, marginTop: 2 },
  cardPrice: { fontSize: 12, color: theme.color.brand, marginTop: 4 },
  cardDesc: { fontSize: 12, color: theme.color.onSurfaceTertiary, marginTop: 6, lineHeight: 16 },
  actions: { flexDirection: 'row', gap: 8, marginTop: theme.spacing.md },
  approveBtn: { flex: 1, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: theme.radius.sm, backgroundColor: theme.color.brand },
  approveText: { color: theme.color.onBrandPrimary, fontSize: 13 },
  rejectBtn: { flex: 1, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: theme.radius.sm, borderWidth: 1, borderColor: theme.color.error },
  rejectText: { color: theme.color.error, fontSize: 13 },
  empty: { alignItems: 'center', padding: theme.spacing.xxxl, gap: theme.spacing.md },
  emptyText: { fontFamily: theme.font.heading, fontSize: 20, color: theme.color.onSurface },
  emptyDim: { color: theme.color.muted, fontSize: 13 },
  modalWrap: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { backgroundColor: theme.color.surfaceSecondary, borderTopLeftRadius: theme.radius.lg, borderTopRightRadius: theme.radius.lg, padding: theme.spacing.xl, paddingTop: theme.spacing.md },
  sheetHandle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: theme.color.borderStrong, marginBottom: theme.spacing.md },
  sheetTitle: { fontFamily: theme.font.heading, fontSize: 22, color: theme.color.onSurface },
  sheetSub: { color: theme.color.muted, marginTop: 4, fontSize: 13 },
  reasonsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: theme.spacing.lg },
  reasonChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: theme.radius.pill, borderWidth: 1, borderColor: theme.color.border, backgroundColor: theme.color.surface },
  reasonChipActive: { borderColor: theme.color.brand, backgroundColor: theme.color.brandTertiary },
  reasonText: { fontSize: 12, color: theme.color.onSurface },
  reasonTextActive: { color: theme.color.onBrandTertiary },
  input: { borderWidth: 1, borderColor: theme.color.border, borderRadius: theme.radius.sm, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: theme.color.onSurface, marginTop: theme.spacing.md, backgroundColor: theme.color.surface },
  rejectSubmit: { marginTop: theme.spacing.lg, backgroundColor: theme.color.error, paddingVertical: 14, borderRadius: theme.radius.sm, alignItems: 'center' },
  rejectSubmitText: { color: theme.color.onError, fontSize: 15 },
});
