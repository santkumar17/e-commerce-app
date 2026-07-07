import { useCallback, useState } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { api } from '@/src/api';
import { theme } from '@/src/theme';

export default function Coupons() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [value, setValue] = useState('');
  const [minOrder, setMinOrder] = useState('');
  const [discountType, setDiscountType] = useState<'percent' | 'flat'>('percent');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(await api.adminListCoupons()); } finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const create = async () => {
    if (!code.trim() || !value.trim()) { setErr('Code and value are required.'); return; }
    setErr(null); setBusy(true);
    try {
      await api.adminCreateCoupon({
        code: code.trim(),
        discount_type: discountType,
        value: parseFloat(value) || 0,
        min_order: parseFloat(minOrder) || 0,
        active: true,
      });
      setCode(''); setValue(''); setMinOrder('');
      load();
    } catch (e: any) { setErr(e.message || 'Could not create'); } finally { setBusy(false); }
  };

  const remove = async (c: string) => {
    await api.adminDeleteCoupon(c);
    load();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Pressable testID="coupons-back" onPress={() => router.back()} hitSlop={12}>
            <Feather name="arrow-left" size={22} color={theme.color.onSurface} />
          </Pressable>
          <Text style={styles.headerTitle}>Coupons</Text>
        </View>
        <FlatList
          data={items}
          keyExtractor={(i) => i.code}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: theme.spacing.xl, paddingBottom: theme.spacing.xxxl }}
          ListHeaderComponent={
            <View style={styles.form}>
              <Text style={styles.section}>New coupon</Text>

              <View style={styles.typeRow}>
                <Pressable
                  testID="type-percent"
                  onPress={() => setDiscountType('percent')}
                  style={[styles.typeBtn, discountType === 'percent' && styles.typeBtnActive]}
                >
                  <Text style={[styles.typeBtnText, discountType === 'percent' && styles.typeBtnTextActive]}>Percent</Text>
                </Pressable>
                <Pressable
                  testID="type-flat"
                  onPress={() => setDiscountType('flat')}
                  style={[styles.typeBtn, discountType === 'flat' && styles.typeBtnActive]}
                >
                  <Text style={[styles.typeBtnText, discountType === 'flat' && styles.typeBtnTextActive]}>Flat $</Text>
                </Pressable>
              </View>

              <Text style={styles.label}>Code</Text>
              <TextInput testID="coupon-code-input" value={code} onChangeText={setCode} autoCapitalize="characters" placeholder="WELCOME10" placeholderTextColor={theme.color.muted} style={styles.input} />

              <Text style={styles.label}>{discountType === 'percent' ? 'Percent off' : 'Amount off ($)'}</Text>
              <TextInput testID="coupon-value-input" value={value} onChangeText={setValue} keyboardType="decimal-pad" placeholder={discountType === 'percent' ? '10' : '5'} placeholderTextColor={theme.color.muted} style={styles.input} />

              <Text style={styles.label}>Minimum order (optional)</Text>
              <TextInput testID="coupon-min-input" value={minOrder} onChangeText={setMinOrder} keyboardType="decimal-pad" placeholder="0" placeholderTextColor={theme.color.muted} style={styles.input} />

              {err && <Text style={styles.err} testID="coupon-err">{err}</Text>}

              <Pressable testID="coupon-create-btn" onPress={create} disabled={busy} style={styles.cta}>
                {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>Create coupon</Text>}
              </Pressable>

              <Text style={styles.section}>Active coupons</Text>
              {loading && <ActivityIndicator color={theme.color.brand} style={{ marginTop: 20 }} />}
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card} testID={`coupon-${item.code}`}>
              <View style={{ flex: 1 }}>
                <Text style={styles.code}>{item.code}</Text>
                <Text style={styles.detail}>
                  {item.discount_type === 'percent' ? `${item.value}% off` : `$${item.value} off`}
                  {item.min_order ? ` · min $${item.min_order}` : ''}
                </Text>
              </View>
              <Pressable testID={`delete-coupon-${item.code}`} onPress={() => remove(item.code)} hitSlop={12}>
                <Feather name="trash-2" size={18} color={theme.color.muted} />
              </Pressable>
            </View>
          )}
          ListEmptyComponent={!loading ? <Text style={styles.empty}>No coupons yet.</Text> : null}
        />
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.color.surface },
  header: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.lg, padding: theme.spacing.xl, paddingBottom: theme.spacing.md },
  headerTitle: { fontFamily: theme.font.heading, fontSize: 24, color: theme.color.onSurface },
  form: {},
  section: { fontFamily: theme.font.heading, fontSize: 18, color: theme.color.onSurface, marginTop: theme.spacing.lg, marginBottom: theme.spacing.md },
  label: { fontSize: 11, color: theme.color.muted, marginTop: theme.spacing.md, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 },
  input: { borderWidth: 1, borderColor: theme.color.border, borderRadius: theme.radius.sm, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: theme.color.surfaceSecondary, fontSize: 15, color: theme.color.onSurface },
  typeRow: { flexDirection: 'row', gap: theme.spacing.md, marginTop: theme.spacing.sm },
  typeBtn: { flex: 1, paddingVertical: 12, borderRadius: theme.radius.sm, borderWidth: 1, borderColor: theme.color.border, alignItems: 'center', backgroundColor: theme.color.surfaceSecondary },
  typeBtnActive: { backgroundColor: theme.color.brand, borderColor: theme.color.brand },
  typeBtnText: { color: theme.color.onSurface, fontSize: 14 },
  typeBtnTextActive: { color: '#fff' },
  err: { color: theme.color.error, marginTop: theme.spacing.md },
  cta: { marginTop: theme.spacing.lg, backgroundColor: theme.color.brand, paddingVertical: 14, borderRadius: theme.radius.sm, alignItems: 'center' },
  ctaText: { color: '#fff', fontSize: 15 },
  card: { flexDirection: 'row', alignItems: 'center', padding: theme.spacing.lg, backgroundColor: theme.color.surfaceSecondary, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.color.border, marginBottom: theme.spacing.sm },
  code: { fontFamily: theme.font.heading, fontSize: 18, color: theme.color.onSurface, letterSpacing: 1 },
  detail: { fontSize: 12, color: theme.color.muted, marginTop: 2 },
  empty: { textAlign: 'center', color: theme.color.muted, marginTop: 20 },
});
