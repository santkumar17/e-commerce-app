import { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, Pressable, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/auth';
import { theme } from '@/src/theme';

type Role = 'customer' | 'seller';

export default function Register() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('customer');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setErr(null);
    setBusy(true);
    try {
      const u = await register({ name: name.trim(), email: email.trim(), password, role });
      if (u.role === 'seller') router.replace('/(seller)/dashboard');
      else router.replace('/(customer)/home');
    } catch (e: any) {
      setErr(e.message || 'Registration failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.color.surface }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Join ArtisanMarket</Text>
        <Text style={styles.sub}>Discover handmade or share your craft.</Text>

        <Text style={styles.label}>I want to</Text>
        <View style={styles.roleRow}>
          <Pressable
            testID="role-customer"
            style={[styles.roleCard, role === 'customer' && styles.roleCardActive]}
            onPress={() => setRole('customer')}
          >
            <Text style={[styles.roleTitle, role === 'customer' && styles.roleTitleActive]}>Shop</Text>
            <Text style={styles.roleDesc}>Browse & buy handmade goods.</Text>
          </Pressable>
          <Pressable
            testID="role-seller"
            style={[styles.roleCard, role === 'seller' && styles.roleCardActive]}
            onPress={() => setRole('seller')}
          >
            <Text style={[styles.roleTitle, role === 'seller' && styles.roleTitleActive]}>Sell</Text>
            <Text style={styles.roleDesc}>List my handmade creations.</Text>
          </Pressable>
        </View>

        <Text style={styles.label}>Name</Text>
        <TextInput testID="register-name-input" value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor={theme.color.muted} style={styles.input} />

        <Text style={styles.label}>Email</Text>
        <TextInput testID="register-email-input" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="you@example.com" placeholderTextColor={theme.color.muted} style={styles.input} />

        <Text style={styles.label}>Password</Text>
        <TextInput testID="register-password-input" value={password} onChangeText={setPassword} secureTextEntry placeholder="At least 6 characters" placeholderTextColor={theme.color.muted} style={styles.input} />

        {err && <Text style={styles.err} testID="register-error">{err}</Text>}

        <Pressable testID="register-submit-button" onPress={submit} disabled={busy} style={styles.primaryBtn}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Create account</Text>}
        </Pressable>

        <Pressable testID="go-to-login" onPress={() => router.replace('/login')} style={styles.linkBtn}>
          <Text style={styles.linkText}>Already have an account? Sign in →</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: theme.spacing.xl, paddingTop: theme.spacing.xxxl, paddingBottom: theme.spacing.xxxl },
  title: { fontFamily: theme.font.heading, fontSize: 32, color: theme.color.onSurface },
  sub: { color: theme.color.muted, marginTop: theme.spacing.xs, fontSize: 14 },
  label: { fontSize: 12, color: theme.color.muted, marginTop: theme.spacing.xl, marginBottom: theme.spacing.xs, textTransform: 'uppercase', letterSpacing: 1 },
  input: { borderWidth: 1, borderColor: theme.color.border, borderRadius: theme.radius.sm, paddingHorizontal: theme.spacing.lg, paddingVertical: 14, fontSize: 16, color: theme.color.onSurface, backgroundColor: theme.color.surfaceSecondary },
  roleRow: { flexDirection: 'row', gap: theme.spacing.md },
  roleCard: { flex: 1, padding: theme.spacing.lg, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.color.border, backgroundColor: theme.color.surfaceSecondary },
  roleCardActive: { borderColor: theme.color.brand, backgroundColor: theme.color.brandTertiary },
  roleTitle: { fontFamily: theme.font.heading, fontSize: 20, color: theme.color.onSurface },
  roleTitleActive: { color: theme.color.onBrandTertiary },
  roleDesc: { color: theme.color.muted, fontSize: 12, marginTop: theme.spacing.xs },
  err: { color: theme.color.error, marginTop: theme.spacing.md, fontSize: 13 },
  primaryBtn: { marginTop: theme.spacing.xl, backgroundColor: theme.color.brand, borderRadius: theme.radius.sm, paddingVertical: 16, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '500' },
  linkBtn: { marginTop: theme.spacing.lg, alignItems: 'center' },
  linkText: { color: theme.color.brand, fontSize: 14 },
});
