import { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, Pressable, KeyboardAvoidingView, Platform,
  ScrollView, ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
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

        {/* Editorial hero */}
        <Animated.View entering={FadeIn.duration(700)} style={styles.hero}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1614244139209-53c071a4737d?w=1200' }}
            style={styles.heroImg}
            contentFit="cover"
            transition={400}
          />
          <LinearGradient
            colors={['rgba(43,41,39,0.15)', 'rgba(43,41,39,0.75)']}
            style={styles.heroScrim}
          />
          <View style={styles.heroContent}>
            <Text style={styles.brandKicker}>Est. 2026 · Artisan-owned</Text>
            <Text style={styles.brand}>ArtisanMarket</Text>
            <View style={styles.brandRule} />
            <Text style={styles.brandSub}>Handmade,{'\n'}quietly beautiful.</Text>
          </View>
        </Animated.View>

        {/* Form card */}
        <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.card}>
          <Text style={styles.cardTitle}>Welcome back</Text>
          <Text style={styles.cardSub}>Sign in to continue.</Text>

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
          <Pressable testID="login-submit-button" onPress={submit} disabled={busy} style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.9 }]}>
            {busy ? <ActivityIndicator color="#fff" /> : (
              <>
                <Text style={styles.primaryBtnText}>Sign in</Text>
              </>
            )}
          </Pressable>
          <Pressable testID="go-to-register" onPress={() => router.push('/register')} style={styles.linkBtn}>
            <Text style={styles.linkText}>New here? Create an account →</Text>
          </Pressable>
        </Animated.View>

        {/* Demo accounts */}
        <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.demoBox}>
          <View style={styles.demoHeader}>
            <View style={styles.demoDot} />
            <Text style={styles.demoTitle}>Demo accounts</Text>
          </View>
          <View style={styles.demoRow}>
            <Pressable testID="demo-customer" style={styles.chip} onPress={() => quickFill('customer')}>
              <Text style={styles.chipText}>Shopper</Text>
            </Pressable>
            <Pressable testID="demo-seller" style={styles.chip} onPress={() => quickFill('seller')}>
              <Text style={styles.chipText}>Artisan</Text>
            </Pressable>
            <Pressable testID="demo-admin" style={styles.chip} onPress={() => quickFill('admin')}>
              <Text style={styles.chipText}>Admin</Text>
            </Pressable>
          </View>
          <Text style={styles.demoHelp}>Tap a role to auto-fill credentials.</Text>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingBottom: theme.spacing.xxxl },

  hero: { height: 380, marginHorizontal: 0 },
  heroImg: { position: 'absolute', width: '100%', height: '100%' },
  heroScrim: { position: 'absolute', width: '100%', height: '100%' },
  heroContent: { flex: 1, padding: theme.spacing.xl, paddingTop: 80, justifyContent: 'flex-end', gap: 0 },
  brandKicker: { color: '#fff', fontSize: 10, letterSpacing: 2.5, textTransform: 'uppercase', opacity: 0.85, marginBottom: 12 },
  brand: { color: '#fff', fontFamily: theme.font.heading, fontSize: 44, letterSpacing: -0.5 },
  brandRule: { width: 40, height: 2, backgroundColor: theme.color.brand, marginVertical: theme.spacing.md, borderRadius: 1 },
  brandSub: { color: '#fff', opacity: 0.9, fontFamily: theme.font.heading, fontSize: 24, lineHeight: 30, fontStyle: 'italic' },

  card: { marginTop: -32, marginHorizontal: theme.spacing.xl, backgroundColor: theme.color.surfaceSecondary, borderRadius: theme.radius.lg, padding: theme.spacing.xl, ...theme.elevation.lift },
  cardTitle: { fontFamily: theme.font.heading, fontSize: 26, color: theme.color.onSurface, letterSpacing: -0.2 },
  cardSub: { color: theme.color.muted, marginTop: 4, fontSize: 13 },

  label: { fontSize: 11, color: theme.color.muted, marginTop: theme.spacing.lg, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1.2 },
  input: { borderWidth: 1, borderColor: theme.color.border, borderRadius: theme.radius.sm, paddingHorizontal: theme.spacing.lg, paddingVertical: 14, fontSize: 16, color: theme.color.onSurface, backgroundColor: theme.color.surface },
  err: { color: theme.color.error, marginTop: theme.spacing.md, fontSize: 13 },
  primaryBtn: { marginTop: theme.spacing.xl, backgroundColor: theme.color.brand, borderRadius: theme.radius.sm, paddingVertical: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  primaryBtnText: { color: '#fff', fontSize: 16, letterSpacing: 0.3 },
  linkBtn: { marginTop: theme.spacing.lg, alignItems: 'center' },
  linkText: { color: theme.color.brand, fontSize: 13 },

  demoBox: { marginTop: theme.spacing.xl, marginHorizontal: theme.spacing.xl, padding: theme.spacing.lg, backgroundColor: theme.color.surfaceTertiary, borderRadius: theme.radius.md },
  demoHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: theme.spacing.md },
  demoDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.color.brand },
  demoTitle: { fontSize: 10, color: theme.color.onSurfaceTertiary, textTransform: 'uppercase', letterSpacing: 1.5 },
  demoRow: { flexDirection: 'row', gap: theme.spacing.sm },
  chip: { flex: 1, paddingVertical: 10, paddingHorizontal: 14, borderRadius: theme.radius.pill, borderWidth: 1, borderColor: theme.color.borderStrong, backgroundColor: theme.color.surfaceSecondary, alignItems: 'center' },
  chipText: { fontSize: 13, color: theme.color.onSurface, letterSpacing: 0.2 },
  demoHelp: { fontSize: 11, color: theme.color.muted, marginTop: theme.spacing.md, textAlign: 'center' },
});
