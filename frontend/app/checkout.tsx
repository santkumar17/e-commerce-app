import { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { api } from '@/src/api';
import { theme } from '@/src/theme';

export default function Checkout() {
  const router = useRouter();
  const [addr, setAddr] = useState({ full_name: '', phone: '', line1: '', city: '', state: '', zip: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  // cart snapshot for totals
  const [subtotal, setSubtotal] = useState(0);
  const [couponInput, setCouponInput] = useState('');
  const [applied, setApplied] = useState<{ code: string; discount: number } | null>(null);
  const [couponBusy, setCouponBusy] = useState(false);
  const [couponMsg, setCouponMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const cart = await api.cart();
        const s = cart.reduce((acc: number, it: any) => acc + (it.product?.price || 0) * it.qty, 0);
        setSubtotal(s);
      } catch { }
    })();
  }, []);

  const set = (k: keyof typeof addr) => (v: string) => setAddr((s) => ({ ...s, [k]: v }));

  const applyCoupon = async () => {
    const code = couponInput.trim();
    if (!code) return;
    setCouponBusy(true); setCouponMsg(null);
    try {
      const r = await api.validateCoupon(code, subtotal);
      setApplied({ code: r.code, discount: r.discount });
      setCouponMsg(`Applied — you saved $${r.discount.toFixed(2)}`);
    } catch (e: any) {
      setApplied(null);
      setCouponMsg(e.message || 'Invalid coupon');
    } finally { setCouponBusy(false); }
  };

  const removeCoupon = () => {
    setApplied(null); setCouponInput(''); setCouponMsg(null);
  };

  const submit = async () => {
    if (!addr.full_name || !addr.phone || !addr.line1 || !addr.city) {
      setErr('Please complete your delivery address.');
      return;
    }
    setErr(null); setBusy(true);
    try {
      await api.checkout(addr, applied?.code);
      setOk(true);
      setTimeout(() => router.replace('/(customer)/orders'), 1200);
    } catch (e: any) {
      setErr(e.message || 'Checkout failed');
    } finally { setBusy(false); }
  };

  const total = Math.max(0, subtotal - (applied?.discount || 0));

  if (ok) {
    return (
      <SafeAreaView style={[styles.safe, { alignItems: 'center', justifyContent: 'center' }]}>
        <View style={styles.successCircle}><Feather name="check" size={32} color="#fff" /></View>
        <Text style={styles.successTitle} testID="order-success">Order placed</Text>
        <Text style={styles.successSub}>Cash on delivery. The artisan has been notified.</Text>
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Pressable testID="checkout-back" onPress={() => router.back()} hitSlop={12}>
            <Feather name="arrow-left" size={22} color={theme.color.onSurface} />
          </Pressable>
          <Text style={styles.headerTitle}>Checkout</Text>
        </View>
        <ScrollView contentContainerStyle={{ padding: theme.spacing.xl, paddingBottom: 220 }} keyboardShouldPersistTaps="handled">
          <Text style={styles.section}>Delivery address</Text>
          <Field label="Full name" testID="addr-name" value={addr.full_name} onChangeText={set('full_name')} />
          <Field label="Phone" testID="addr-phone" value={addr.phone} onChangeText={set('phone')} keyboardType="phone-pad" />
          <Field label="Address line" testID="addr-line" value={addr.line1} onChangeText={set('line1')} />
          <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
            <View style={{ flex: 1 }}><Field label="City" testID="addr-city" value={addr.city} onChangeText={set('city')} /></View>
            <View style={{ flex: 1 }}><Field label="State" testID="addr-state" value={addr.state} onChangeText={set('state')} /></View>
          </View>
          <Field label="ZIP / Postal" testID="addr-zip" value={addr.zip} onChangeText={set('zip')} />

          <Text style={styles.section}>Promo code</Text>
          {applied ? (
            <View style={styles.appliedBox} testID="applied-coupon">
              <Feather name="tag" size={16} color={theme.color.success} />
              <View style={{ flex: 1 }}>
                <Text style={styles.appliedCode}>{applied.code}</Text>
                <Text style={styles.appliedSaved}>You saved ${applied.discount.toFixed(2)}</Text>
              </View>
              <Pressable testID="remove-coupon" onPress={removeCoupon} hitSlop={8}>
                <Feather name="x" size={18} color={theme.color.muted} />
              </Pressable>
            </View>
          ) : (
            <View style={styles.couponRow}>
              <TextInput
                testID="coupon-input"
                value={couponInput}
                onChangeText={setCouponInput}
                placeholder="e.g. WELCOME10"
                placeholderTextColor={theme.color.muted}
                autoCapitalize="characters"
                style={[styles.input, { flex: 1 }]}
              />
              <Pressable testID="apply-coupon-btn" onPress={applyCoupon} disabled={couponBusy || !couponInput.trim()} style={styles.applyBtn}>
                {couponBusy ? <ActivityIndicator size="small" color={theme.color.brand} /> : <Text style={styles.applyBtnText}>Apply</Text>}
              </Pressable>
            </View>
          )}
          {couponMsg && (
            <Text style={[styles.couponMsg, { color: applied ? theme.color.success : theme.color.error }]} testID="coupon-msg">
              {couponMsg}
            </Text>
          )}

          <Text style={styles.section}>Payment</Text>
          <View style={styles.paymentCard}>
            <Feather name="dollar-sign" size={18} color={theme.color.brand} />
            <View style={{ flex: 1 }}>
              <Text style={styles.payTitle}>Cash on Delivery</Text>
              <Text style={styles.payDesc}>Pay when the order arrives.</Text>
            </View>
            <View style={styles.dot} />
          </View>

          {err && <Text style={styles.err} testID="checkout-error">{err}</Text>}
        </ScrollView>
        <SafeAreaView edges={['bottom']} style={styles.footer}>
          <View style={styles.totals}>
            <View style={styles.totalLine}>
              <Text style={styles.totalMuted}>Subtotal</Text>
              <Text style={styles.totalMuted}>${subtotal.toFixed(2)}</Text>
            </View>
            {applied && (
              <View style={styles.totalLine}>
                <Text style={styles.totalDiscount}>Discount ({applied.code})</Text>
                <Text style={styles.totalDiscount}>−${applied.discount.toFixed(2)}</Text>
              </View>
            )}
            <View style={styles.totalLine}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalVal} testID="checkout-total">${total.toFixed(2)}</Text>
            </View>
          </View>
          <Pressable testID="place-order-btn" onPress={submit} disabled={busy} style={styles.cta}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>Place order (COD)</Text>}
          </Pressable>
        </SafeAreaView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

function Field(props: any) {
  return (
    <>
      <Text style={styles.label}>{props.label}</Text>
      <TextInput {...props} placeholderTextColor={theme.color.muted} style={styles.input} />
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.color.surface },
  header: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.lg, padding: theme.spacing.xl, paddingBottom: theme.spacing.md },
  headerTitle: { fontFamily: theme.font.heading, fontSize: 24, color: theme.color.onSurface },
  section: { fontFamily: theme.font.heading, fontSize: 18, color: theme.color.onSurface, marginTop: theme.spacing.lg, marginBottom: theme.spacing.md },
  label: { fontSize: 11, color: theme.color.muted, marginTop: theme.spacing.md, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 },
  input: { borderWidth: 1, borderColor: theme.color.border, borderRadius: theme.radius.sm, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: theme.color.surfaceSecondary, fontSize: 15, color: theme.color.onSurface },
  couponRow: { flexDirection: 'row', gap: theme.spacing.md, alignItems: 'stretch' },
  applyBtn: { paddingHorizontal: 20, borderRadius: theme.radius.sm, borderWidth: 1, borderColor: theme.color.brand, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.color.brandTertiary },
  applyBtnText: { color: theme.color.brand, fontSize: 14, fontWeight: '500' },
  couponMsg: { marginTop: 8, fontSize: 12 },
  appliedBox: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, padding: theme.spacing.md, borderRadius: theme.radius.sm, backgroundColor: '#EAF3EA', borderWidth: 1, borderColor: theme.color.success },
  appliedCode: { fontSize: 15, color: theme.color.onSurface, fontWeight: '500' },
  appliedSaved: { fontSize: 12, color: theme.color.success, marginTop: 2 },
  paymentCard: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, padding: theme.spacing.lg, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.color.brand, backgroundColor: theme.color.brandTertiary },
  payTitle: { fontSize: 15, color: theme.color.onBrandTertiary },
  payDesc: { fontSize: 12, color: theme.color.onSurfaceTertiary, marginTop: 2 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: theme.color.brand },
  err: { color: theme.color.error, marginTop: theme.spacing.md },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: theme.color.surfaceSecondary, padding: theme.spacing.xl, borderTopWidth: 1, borderTopColor: theme.color.border },
  totals: { marginBottom: theme.spacing.md },
  totalLine: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  totalMuted: { color: theme.color.muted, fontSize: 13 },
  totalDiscount: { color: theme.color.success, fontSize: 13 },
  totalLabel: { fontSize: 14, color: theme.color.onSurface, marginTop: 6 },
  totalVal: { fontFamily: theme.font.heading, fontSize: 22, color: theme.color.onSurface, marginTop: 6 },
  cta: { backgroundColor: theme.color.brand, paddingVertical: 16, borderRadius: theme.radius.sm, alignItems: 'center' },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '500' },
  successCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: theme.color.success, alignItems: 'center', justifyContent: 'center' },
  successTitle: { fontFamily: theme.font.heading, fontSize: 28, color: theme.color.onSurface, marginTop: theme.spacing.lg },
  successSub: { color: theme.color.muted, marginTop: theme.spacing.sm, textAlign: 'center', paddingHorizontal: theme.spacing.xxl },
});
