import { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, Pressable, KeyboardAvoidingView, Platform,
  ScrollView, ActivityIndicator, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/auth';
import { theme } from '@/src/theme';

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setErr(null);
    setBusy(true);
    try {
      const u = await login(email.trim(), password);
      if (u.role === 'seller') router.replace('/(seller)/dashboard');
      else if (u.role === 'admin') router.replace('/(admin)/queue');
      else router.replace('/(customer)/home');
    } catch (e: any) {
      setErr(e.message || 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  const quickFill = (role: 'customer' | 'seller' | 'admin') => {
    if (role === 'customer') { setEmail('customer@artisan.market'); setPassword('Customer123!'); }
    if (role === 'seller') { setEmail('seller@artisan.market'); setPassword('Seller123!'); }
    if (role === 'admin') { setEmail('admin@artisan.market'); setPassword('Admin123!'); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.color.surface }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1614244139209-53c071a4737d?w=800' }}
          style={styles.hero}
        />
        <Text style={styles.brand}>ArtisanMarket</Text>
        <Text style={styles.sub}>Handmade, quietly beautiful.</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            testID="login-email-input"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@example.com"
            placeholderTextColor={theme.color.muted}
            style={styles.input}
          />
          <Text style={styles.label}>Password</Text>
          <TextInput
            testID="login-password-input"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor={theme.color.muted}
            style={styles.input}
          />
          {err && <Text style={styles.err} testID="login-error">{err}</Text>}
          <Pressable testID="login-submit-button" onPress={submit} disabled={busy} style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }]}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Sign in</Text>}
          </Pressable>
          <Pressable testID="go-to-register" onPress={() => router.push('/register')} style={styles.linkBtn}>
            <Text style={styles.linkText}>New here? Create an account →</Text>
          </Pressable>
        </View>

        <View style={styles.demoBox}>
          <Text style={styles.demoTitle}>Demo accounts</Text>
          <View style={styles.demoRow}>
            <Pressable testID="demo-customer" style={styles.chip} onPress={() => quickFill('customer')}>
              <Text style={styles.chipText}>Customer</Text>
            </Pressable>
            <Pressable testID="demo-seller" style={styles.chip} onPress={() => quickFill('seller')}>
              <Text style={styles.chipText}>Seller</Text>
            </Pressable>
            <Pressable testID="demo-admin" style={styles.chip} onPress={() => quickFill('admin')}>
              <Text style={styles.chipText}>Admin</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: theme.spacing.xl, paddingBottom: theme.spacing.xxxl },
  hero: { width: '100%', height: 180, borderRadius: theme.radius.md, marginTop: theme.spacing.xl },
  brand: { fontFamily: theme.font.heading, fontSize: 34, color: theme.color.onSurface, marginTop: theme.spacing.xl, letterSpacing: 0.5 },
  sub: { fontFamily: theme.font.body, color: theme.color.muted, marginTop: theme.spacing.xs, fontSize: 14 },
  form: { marginTop: theme.spacing.xl },
  label: { fontSize: 12, color: theme.color.muted, marginTop: theme.spacing.lg, marginBottom: theme.spacing.xs, textTransform: 'uppercase', letterSpacing: 1 },
  input: {
    borderWidth: 1, borderColor: theme.color.border, borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.lg, paddingVertical: 14, fontSize: 16, color: theme.color.onSurface,
    backgroundColor: theme.color.surfaceSecondary,
  },
  err: { color: theme.color.error, marginTop: theme.spacing.md, fontSize: 13 },
  primaryBtn: {
    marginTop: theme.spacing.xl, backgroundColor: theme.color.brand, borderRadius: theme.radius.sm,
    paddingVertical: 16, alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '500' },
  linkBtn: { marginTop: theme.spacing.lg, alignItems: 'center' },
  linkText: { color: theme.color.brand, fontSize: 14 },
  demoBox: { marginTop: theme.spacing.xxl, padding: theme.spacing.lg, backgroundColor: theme.color.surfaceTertiary, borderRadius: theme.radius.md },
  demoTitle: { fontSize: 12, color: theme.color.onSurfaceTertiary, marginBottom: theme.spacing.md, textTransform: 'uppercase', letterSpacing: 1 },
  demoRow: { flexDirection: 'row', gap: theme.spacing.sm },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: theme.radius.pill, borderWidth: 1, borderColor: theme.color.borderStrong, backgroundColor: theme.color.surfaceSecondary },
  chipText: { fontSize: 13, color: theme.color.onSurface },
});
